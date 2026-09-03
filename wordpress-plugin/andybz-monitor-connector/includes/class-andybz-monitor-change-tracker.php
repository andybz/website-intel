<?php
/**
 * Tracks WordPress changes (plugin/theme/core updates), failed logins, and
 * 404s, reporting them as monitoring events.
 *
 * @package AndyBZ_Monitor_Connector
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class AndyBZ_Monitor_Change_Tracker {

	/**
	 * @var AndyBZ_Monitor_Change_Tracker|null
	 */
	private static $instance = null;

	/** Minimum time between reported failed-login events, to survive brute-force floods. */
	const LOGIN_THROTTLE_SECONDS = 10;

	public static function instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	private function __construct() {
		add_action( 'plugins_loaded', array( $this, 'maybe_register_hooks' ), 20 );
	}

	public function maybe_register_hooks() {
		if ( ! AndyBZ_Monitor_Connector::instance()->is_connected() ) {
			return;
		}

		add_action( 'activated_plugin', array( $this, 'on_plugin_activated' ) );
		add_action( 'deactivated_plugin', array( $this, 'on_plugin_deactivated' ) );
		add_action( 'upgrader_process_complete', array( $this, 'on_upgrader_complete' ), 10, 2 );
		add_action( 'wp_login_failed', array( $this, 'on_login_failed' ) );
		add_action( 'template_redirect', array( $this, 'on_template_redirect' ) );
	}

	public function on_plugin_activated( $plugin ) {
		AndyBZ_Monitor_Event_Client::send(
			array(
				'eventType' => 'plugin_activated',
				'category'  => 'change',
				'message'   => sprintf( '%s was activated', $this->plugin_name_from_file( $plugin ) )
			)
		);
	}

	public function on_plugin_deactivated( $plugin ) {
		AndyBZ_Monitor_Event_Client::send(
			array(
				'eventType' => 'plugin_deactivated',
				'category'  => 'change',
				'message'   => sprintf( '%s was deactivated', $this->plugin_name_from_file( $plugin ) )
			)
		);
	}

	/**
	 * Fires after WP core/plugin/theme updates (single or bulk).
	 *
	 * @param WP_Upgrader $upgrader
	 * @param array       $hook_extra
	 */
	public function on_upgrader_complete( $upgrader, $hook_extra ) {
		if ( ! isset( $hook_extra['action'] ) || 'update' !== $hook_extra['action'] ) {
			return;
		}

		$type = $hook_extra['type'] ?? '';

		if ( 'plugin' === $type ) {
			foreach ( (array) ( $hook_extra['plugins'] ?? array() ) as $plugin_file ) {
				AndyBZ_Monitor_Event_Client::send(
					array(
						'eventType' => 'plugin_updated',
						'category'  => 'change',
						'message'   => sprintf( '%s was updated', $this->plugin_name_from_file( $plugin_file ) )
					)
				);
			}
		} elseif ( 'theme' === $type ) {
			foreach ( (array) ( $hook_extra['themes'] ?? array() ) as $stylesheet ) {
				AndyBZ_Monitor_Event_Client::send(
					array(
						'eventType' => 'theme_updated',
						'category'  => 'change',
						'message'   => sprintf( 'Theme "%s" was updated', $stylesheet )
					)
				);
			}
		} elseif ( 'core' === $type ) {
			AndyBZ_Monitor_Event_Client::send(
				array(
					'eventType' => 'wordpress_updated',
					'category'  => 'change',
					'message'   => sprintf( 'WordPress was updated to %s', get_bloginfo( 'version' ) )
				)
			);
		}
	}

	public function on_login_failed( $username ) {
		$throttle_key = 'andybz_monitor_login_throttle';
		if ( false !== get_transient( $throttle_key ) ) {
			return;
		}
		set_transient( $throttle_key, 1, self::LOGIN_THROTTLE_SECONDS );

		AndyBZ_Monitor_Event_Client::send(
			array(
				'eventType' => 'failed_login',
				'category'  => 'security',
				'message'   => 'A failed login attempt was detected',
				'metadata'  => array(
					// Capped length - a login "username" field is sometimes
					// where a mistyped password ends up, so keep this short
					// and let the server's sanitizer be the second layer of defense.
					'username'  => mb_substr( sanitize_text_field( $username ), 0, 190 ),
					'ipAddress' => AndyBZ_Monitor_Event_Client::current_client_ip(),
				),
			)
		);
	}

	public function on_template_redirect() {
		if ( ! is_404() ) {
			return;
		}

		$path = AndyBZ_Monitor_Event_Client::current_request_path();

		AndyBZ_Monitor_Event_Client::send(
			array(
				'eventType'  => 'http_404',
				'category'   => 'error',
				// Include the path in the message so distinct URLs group into
				// distinct issues (e.g. README's "10,000 favicon 404s" example).
				'message'    => sprintf( 'Page not found: %s', $path ? $path : '(unknown)' ),
				'requestUrl' => $path,
			)
		);
	}

	private function plugin_name_from_file( $plugin_file ) {
		if ( ! function_exists( 'get_plugin_data' ) ) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';
		}

		$path = WP_PLUGIN_DIR . '/' . $plugin_file;
		if ( file_exists( $path ) ) {
			$data = get_plugin_data( $path, false, false );
			if ( ! empty( $data['Name'] ) ) {
				return $data['Name'];
			}
		}

		return $plugin_file;
	}
}
