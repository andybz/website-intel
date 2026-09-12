<?php
/**
 * Periodic synthetic page-load check: measures how long the homepage takes
 * to respond and looks for the largest asset files loaded on it. Throttled
 * to roughly once an hour so it never runs on every 5-minute heartbeat.
 *
 * @package AndyBZ_Monitor_Connector
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class AndyBZ_Monitor_Performance {

	const LAST_CHECK_OPTION      = 'andybz_monitor_last_performance_check';
	const LAST_ERROR_OPTION      = 'andybz_monitor_performance_last_error';
	const CHECK_INTERVAL_SECONDS = HOUR_IN_SECONDS;
	const MAX_ASSETS_TO_CHECK    = 10;

	/**
	 * @var AndyBZ_Monitor_Performance|null
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
	 * Runs a fresh check if enough time has passed since the last one,
	 * otherwise returns null so the heartbeat simply omits fresh data.
	 *
	 * @return array|null
	 */
	public function maybe_check() {
		$last_check = (int) get_option( self::LAST_CHECK_OPTION, 0 );

		if ( ( time() - $last_check ) < self::CHECK_INTERVAL_SECONDS ) {
			return null;
		}

		// Set before running so an overlapping cron tick can't double-check.
		update_option( self::LAST_CHECK_OPTION, time(), false );

		return $this->run_check();
	}

	/**
	 * The most recent failure reason, if the last check didn't succeed -
	 * shown on the settings page so a permanently-failing host isn't a
	 * silent, invisible gap in the Performance tab.
	 *
	 * @return string
	 */
	public function get_last_error() {
		return (string) get_option( self::LAST_ERROR_OPTION, '' );
	}

	/**
	 * @return array|null
	 */
	private function run_check() {
		$start    = microtime( true );
		$response = wp_remote_get( home_url( '/' ), array( 'timeout' => 20 ) );

		// Some hosts fail loopback requests over a mismatched/self-signed
		// certificate (a well-known WordPress "loopback request" issue) -
		// retry once without SSL verification before giving up, same as the
		// site's own homepage HTML is public content either way.
		if ( is_wp_error( $response ) && false !== stripos( $response->get_error_message(), 'ssl' ) ) {
			$response = wp_remote_get( home_url( '/' ), array( 'timeout' => 20, 'sslverify' => false ) );
		}

		if ( is_wp_error( $response ) ) {
			update_option( self::LAST_ERROR_OPTION, $response->get_error_message(), false );
			return null;
		}

		$code = wp_remote_retrieve_response_code( $response );
		if ( $code < 200 || $code >= 400 ) {
			update_option( self::LAST_ERROR_OPTION, sprintf( 'Homepage returned HTTP %d.', $code ), false );
			return null;
		}

		update_option( self::LAST_ERROR_OPTION, '', false );

		$load_time_ms    = (int) round( ( microtime( true ) - $start ) * 1000 );
		$body            = wp_remote_retrieve_body( $response );
		$page_size_bytes = strlen( $body );

		return array(
			'loadTimeMs'    => $load_time_ms,
			'pageSizeBytes' => $page_size_bytes,
			'assets'        => $this->find_bulkiest_assets( $body ),
		);
	}

	/**
	 * Scans the homepage HTML for linked CSS/JS/images and checks their
	 * sizes via HEAD requests, capped so this never becomes a slow scan.
	 *
	 * @param string $html
	 * @return array
	 */
	private function find_bulkiest_assets( $html ) {
		$candidates = array();

		if ( preg_match_all( '/<link[^>]+rel=["\']stylesheet["\'][^>]+href=["\']([^"\']+)["\']/i', $html, $matches ) ) {
			foreach ( $matches[1] as $url ) {
				$candidates[] = array(
					'url'  => $url,
					'type' => 'style',
				);
			}
		}

		if ( preg_match_all( '/<script[^>]+src=["\']([^"\']+)["\']/i', $html, $matches ) ) {
			foreach ( $matches[1] as $url ) {
				$candidates[] = array(
					'url'  => $url,
					'type' => 'script',
				);
			}
		}

		if ( preg_match_all( '/<img[^>]+src=["\']([^"\']+)["\']/i', $html, $matches ) ) {
			foreach ( $matches[1] as $url ) {
				$candidates[] = array(
					'url'  => $url,
					'type' => 'image',
				);
			}
		}

		$candidates = array_slice( $candidates, 0, self::MAX_ASSETS_TO_CHECK );
		$assets     = array();

		foreach ( $candidates as $candidate ) {
			$absolute_url = $this->to_absolute_url( $candidate['url'] );
			if ( ! $absolute_url ) {
				continue;
			}

			$head = wp_remote_head( $absolute_url, array( 'timeout' => 5 ) );
			if ( is_wp_error( $head ) ) {
				continue;
			}

			$length = wp_remote_retrieve_header( $head, 'content-length' );
			if ( '' === $length || null === $length || ! is_numeric( $length ) ) {
				continue;
			}

			$assets[] = array(
				'url'       => $absolute_url,
				'type'      => $candidate['type'],
				'sizeBytes' => (int) $length,
			);
		}

		return $assets;
	}

	/**
	 * Resolves a possibly-relative/protocol-relative asset URL against the
	 * site's own home URL. Returns null for anything else (e.g. data: URIs).
	 *
	 * @param string $url
	 * @return string|null
	 */
	private function to_absolute_url( $url ) {
		if ( 0 === strpos( $url, '//' ) ) {
			return ( is_ssl() ? 'https:' : 'http:' ) . $url;
		}

		if ( 0 === strpos( $url, 'http://' ) || 0 === strpos( $url, 'https://' ) ) {
			return $url;
		}

		if ( 0 === strpos( $url, '/' ) ) {
			return untrailingslashit( home_url() ) . $url;
		}

		return null;
	}
}
