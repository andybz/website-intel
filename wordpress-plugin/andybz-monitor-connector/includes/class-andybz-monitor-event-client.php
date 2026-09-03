<?php
/**
 * Shared HTTP client for sending events to the monitoring application.
 *
 * @package AndyBZ_Monitor_Connector
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class AndyBZ_Monitor_Event_Client {

	/**
	 * Sends a single event payload. Non-blocking so a slow/unreachable
	 * monitoring app never adds latency to the site's response.
	 *
	 * @param array $payload eventType, message, and any optional fields
	 *                       (category, file, line, stackTrace, requestUrl, metadata).
	 * @return true|WP_Error
	 */
	public static function send( array $payload ) {
		$connector = AndyBZ_Monitor_Connector::instance();

		if ( ! $connector->is_connected() ) {
			return new WP_Error( 'andybz_monitor_not_connected', __( 'This website is not connected yet.', 'andybz-monitor-connector' ) );
		}

		$settings = $connector->get_settings();
		$url      = untrailingslashit( $settings['app_url'] ) . '/api/sites/' . rawurlencode( $settings['site_id'] ) . '/events';

		return wp_remote_post(
			$url,
			array(
				'timeout'  => 3,
				'blocking' => false,
				'headers'  => array(
					'Content-Type'  => 'application/json',
					'Authorization' => 'Bearer ' . $settings['secret'],
				),
				'body'     => wp_json_encode( $payload ),
			)
		);
	}

	/**
	 * The current request's path with the query string stripped (it may
	 * carry sensitive values) - defense in depth, the server also sanitizes this.
	 */
	public static function current_request_path() {
		if ( ! isset( $_SERVER['REQUEST_URI'] ) ) {
			return null;
		}
		return strtok( sanitize_text_field( wp_unslash( $_SERVER['REQUEST_URI'] ) ), '?' );
	}

	/**
	 * Best-effort client IP. Uses REMOTE_ADDR only (the actual TCP peer) -
	 * not X-Forwarded-For/etc., since those are trivially spoofable unless
	 * the site is known to sit behind a trusted proxy, which we can't assume.
	 */
	public static function current_client_ip() {
		if ( ! isset( $_SERVER['REMOTE_ADDR'] ) ) {
			return null;
		}
		return sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) );
	}
}
