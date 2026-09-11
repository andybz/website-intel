<?php
/**
 * Sends a lightweight pageview signal for basic bot vs. human traffic
 * classification (README sections 15/26). The monitoring app does the actual
 * classification server-side - this class just reports the User-Agent for a
 * real front-end page load, never for admin/AJAX/REST/cron requests.
 *
 * @package AndyBZ_Monitor_Connector
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class AndyBZ_Monitor_Traffic {

	/**
	 * @var AndyBZ_Monitor_Traffic|null
	 */
	private static $instance = null;

	public static function instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	private function __construct() {
		add_action( 'wp_footer', array( $this, 'maybe_send_pageview' ) );
	}

	public function maybe_send_pageview() {
		if ( is_admin() || wp_doing_ajax() || wp_doing_cron() || ( defined( 'REST_REQUEST' ) && REST_REQUEST ) ) {
			return;
		}

		$user_agent = isset( $_SERVER['HTTP_USER_AGENT'] ) ? sanitize_text_field( wp_unslash( $_SERVER['HTTP_USER_AGENT'] ) ) : '';

		AndyBZ_Monitor_Event_Client::send( array( 'userAgent' => $user_agent ), 'pageviews' );
	}
}
