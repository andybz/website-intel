<?php
/**
 * Collects site metadata and sends periodic heartbeats to the monitoring app.
 *
 * @package AndyBZ_Monitor_Connector
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class AndyBZ_Monitor_Heartbeat {

	const CRON_HOOK = 'andybz_monitor_heartbeat_event';
	const CRON_INTERVAL = 'andybz_monitor_five_minutes';
	// WP-Cron only runs when a request happens to arrive after it's due (and
	// not at all if DISABLE_WP_CRON is set with no replacement system cron),
	// so throttle a lightweight opportunistic heartbeat onto real requests too.
	const OPPORTUNISTIC_THROTTLE_TRANSIENT = 'andybz_monitor_last_opportunistic_heartbeat';
	const OPPORTUNISTIC_THROTTLE_SECONDS = 4 * MINUTE_IN_SECONDS;

	/**
	 * @var AndyBZ_Monitor_Heartbeat|null
	 */
	private static $instance = null;

	public static function instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	private function __construct() {
		add_filter( 'cron_schedules', array( $this, 'register_cron_interval' ) );
		add_action( self::CRON_HOOK, array( $this, 'send_heartbeat' ) );
		// Send an immediate heartbeat right after a successful connect so the
		// dashboard shows real data without waiting for the next cron tick.
		add_action( 'andybz_monitor_connected', array( $this, 'send_heartbeat' ) );
		// Fires on every real request (front-end or admin) regardless of
		// WP-Cron's state, so low-traffic or DISABLE_WP_CRON sites still stay fresh.
		add_action( 'init', array( $this, 'maybe_send_opportunistic_heartbeat' ) );
	}

	public function register_cron_interval( $schedules ) {
		$schedules[ self::CRON_INTERVAL ] = array(
			'interval' => 5 * MINUTE_IN_SECONDS,
			'display'  => __( 'Every 5 minutes (AndyBZ Monitor)', 'andybz-monitor-connector' ),
		);
		return $schedules;
	}

	/**
	 * Activation hook callback (must be static; the class may not be
	 * instantiated yet when register_activation_hook fires).
	 */
	public static function activate() {
		self::instance()->schedule_events();
	}

	/**
	 * Deactivation hook callback.
	 */
	public static function deactivate() {
		self::instance()->clear_scheduled_events();
	}

	public function schedule_events() {
		if ( ! wp_next_scheduled( self::CRON_HOOK ) ) {
			wp_schedule_event( time(), self::CRON_INTERVAL, self::CRON_HOOK );
		}
	}

	public function clear_scheduled_events() {
		$timestamp = wp_next_scheduled( self::CRON_HOOK );
		if ( $timestamp ) {
			wp_unschedule_event( $timestamp, self::CRON_HOOK );
		}
	}

	/**
	 * Gather safe, non-sensitive site metadata to report.
	 *
	 * @return array
	 */
	public function collect_site_data() {
		if ( ! function_exists( 'get_plugins' ) ) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';
		}

		$theme = wp_get_theme();
		$plugins = array();

		foreach ( get_plugins() as $plugin_file => $plugin_data ) {
			$plugins[] = array(
				'slug'     => dirname( $plugin_file ) !== '.' ? dirname( $plugin_file ) : basename( $plugin_file, '.php' ),
				'name'     => isset( $plugin_data['Name'] ) ? $plugin_data['Name'] : $plugin_file,
				'version'  => isset( $plugin_data['Version'] ) ? $plugin_data['Version'] : null,
				'isActive' => is_plugin_active( $plugin_file ),
			);
		}

		return array(
			'wordpressVersion' => get_bloginfo( 'version' ),
			'phpVersion'       => PHP_VERSION,
			'serverSoftware'   => isset( $_SERVER['SERVER_SOFTWARE'] ) ? sanitize_text_field( wp_unslash( $_SERVER['SERVER_SOFTWARE'] ) ) : '',
			'activeTheme'      => $theme->get( 'Name' ),
			'themeVersion'     => $theme->get( 'Version' ),
			'isMultisite'      => is_multisite(),
			'plugins'          => $plugins,
		);
	}

	/**
	 * Send a heartbeat with current site metadata to the monitoring app.
	 *
	 * @return true|WP_Error
	 */
	public function send_heartbeat() {
		return $this->send_heartbeat_request( true );
	}

	/**
	 * Opportunistically nudge a heartbeat on real requests, throttled so it
	 * can run at most once per interval and never blocks the page response.
	 */
	public function maybe_send_opportunistic_heartbeat() {
		$connector = AndyBZ_Monitor_Connector::instance();

		if ( ! $connector->is_connected() ) {
			return;
		}

		if ( false !== get_transient( self::OPPORTUNISTIC_THROTTLE_TRANSIENT ) ) {
			return;
		}

		// Set the throttle before sending so overlapping concurrent requests
		// can't all slip through before the first one finishes.
		set_transient( self::OPPORTUNISTIC_THROTTLE_TRANSIENT, time(), self::OPPORTUNISTIC_THROTTLE_SECONDS );
		$this->send_heartbeat_request( false );
	}

	/**
	 * @param bool $blocking Whether to wait for and validate the response.
	 *                       False sends a fire-and-forget request so it never
	 *                       adds latency to a real visitor's page load.
	 * @return true|WP_Error
	 */
	private function send_heartbeat_request( $blocking ) {
		$connector = AndyBZ_Monitor_Connector::instance();

		if ( ! $connector->is_connected() ) {
			return new WP_Error( 'andybz_monitor_not_connected', __( 'This website is not connected yet.', 'andybz-monitor-connector' ) );
		}

		$settings = $connector->get_settings();
		$url      = untrailingslashit( $settings['app_url'] ) . '/api/sites/' . rawurlencode( $settings['site_id'] ) . '/heartbeat';

		$response = wp_remote_post(
			$url,
			array(
				'timeout'   => $blocking ? 15 : 0.01,
				'blocking'  => $blocking,
				'headers'   => array(
					'Content-Type'  => 'application/json',
					'Authorization' => 'Bearer ' . $settings['secret'],
				),
				'body'      => wp_json_encode( $this->collect_site_data() ),
			)
		);

		if ( ! $blocking ) {
			return true;
		}

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$code = wp_remote_retrieve_response_code( $response );

		if ( 200 !== $code ) {
			$body    = json_decode( wp_remote_retrieve_body( $response ), true );
			$message = ( is_array( $body ) && ! empty( $body['message'] ) )
				? $body['message']
				: __( 'The monitoring application rejected the heartbeat.', 'andybz-monitor-connector' );

			return new WP_Error( 'andybz_monitor_heartbeat_failed', $message );
		}

		return true;
	}
}
