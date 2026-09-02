<?php
/**
 * Core connection logic: stores credentials and talks to the monitoring app.
 *
 * @package AndyBZ_Monitor_Connector
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class AndyBZ_Monitor_Connector {

	/**
	 * @var AndyBZ_Monitor_Connector|null
	 */
	private static $instance = null;

	public static function instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	private function __construct() {}

	/**
	 * Retrieve the stored connection settings, merged with defaults.
	 *
	 * @return array{app_url:string,site_id:string,secret:string,status:string}
	 */
	public function get_settings() {
		$defaults = array(
			'app_url' => ANDYBZ_MONITOR_DEFAULT_APP_URL,
			'site_id' => '',
			'secret'  => '',
			'status'  => 'disconnected', // disconnected|connected
		);

		$settings = get_option( ANDYBZ_MONITOR_OPTION, array() );

		if ( ! is_array( $settings ) ) {
			$settings = array();
		}

		return wp_parse_args( $settings, $defaults );
	}

	/**
	 * Whether this site currently holds a permanent credential.
	 */
	public function is_connected() {
		$settings = $this->get_settings();
		return 'connected' === $settings['status'] && '' !== $settings['site_id'] && '' !== $settings['secret'];
	}

	/**
	 * Exchange a short-lived pairing key for permanent credentials.
	 *
	 * @param string $app_url       Base URL of the monitoring application.
	 * @param string $pairing_token Pairing key entered by the user.
	 * @return true|WP_Error
	 */
	public function connect( $app_url, $pairing_token ) {
		$app_url       = untrailingslashit( trim( $app_url ) );
		$pairing_token = trim( $pairing_token );

		if ( '' === $app_url || ! wp_http_validate_url( $app_url ) ) {
			return new WP_Error(
				'andybz_monitor_invalid_url',
				__( 'Enter a valid monitoring application URL.', 'andybz-monitor-connector' )
			);
		}

		if ( '' === $pairing_token ) {
			return new WP_Error(
				'andybz_monitor_missing_token',
				__( 'Enter the connection key.', 'andybz-monitor-connector' )
			);
		}

		$response = wp_remote_post(
			$app_url . '/api/connect',
			array(
				'timeout' => 15,
				'headers' => array( 'Content-Type' => 'application/json' ),
				'body'    => wp_json_encode( array( 'pairingToken' => $pairing_token ) ),
			)
		);

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$code = wp_remote_retrieve_response_code( $response );
		$body = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( 200 !== $code ) {
			$message = ( is_array( $body ) && ! empty( $body['message'] ) )
				? $body['message']
				: __( 'Unable to connect. Please check the key and try again.', 'andybz-monitor-connector' );

			return new WP_Error( 'andybz_monitor_connect_failed', $message );
		}

		if ( empty( $body['siteId'] ) || empty( $body['secret'] ) ) {
			return new WP_Error(
				'andybz_monitor_bad_response',
				__( 'Unexpected response from the monitoring application.', 'andybz-monitor-connector' )
			);
		}

		$this->save_settings(
			array(
				'app_url' => $app_url,
				'site_id' => sanitize_text_field( $body['siteId'] ),
				'secret'  => sanitize_text_field( $body['secret'] ),
				'status'  => 'connected',
			)
		);

		/**
		 * Fires right after a successful pairing. Used to trigger an
		 * immediate heartbeat instead of waiting for the next cron tick.
		 */
		do_action( 'andybz_monitor_connected' );

		return true;
	}

	/**
	 * Forget this site's credentials. Does not contact the server.
	 */
	public function disconnect() {
		delete_option( ANDYBZ_MONITOR_OPTION );
	}

	/**
	 * Persist settings. Autoload is disabled since this holds a secret.
	 *
	 * @param array $changes Partial settings to merge and save.
	 */
	private function save_settings( array $changes ) {
		$settings = wp_parse_args( $changes, $this->get_settings() );
		update_option( ANDYBZ_MONITOR_OPTION, $settings, false );
	}
}
