<?php
/**
 * Captures PHP errors and reports them as monitoring events.
 *
 * @package AndyBZ_Monitor_Connector
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class AndyBZ_Monitor_Error_Reporter {

	/**
	 * @var AndyBZ_Monitor_Error_Reporter|null
	 */
	private static $instance = null;

	/** Signatures already reported during this PHP process/request. */
	private $reported_this_request = array();

	/** Re-entrancy guard so a warning triggered while reporting can't loop. */
	private $is_reporting = false;

	/** Minimum time between reports of the same error signature. */
	const THROTTLE_SECONDS = 60;

	public static function instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	private function __construct() {
		add_action( 'plugins_loaded', array( $this, 'maybe_register_handlers' ), 20 );
	}

	/**
	 * Only hook into error handling once this site actually has credentials -
	 * no point reporting from a site that isn't connected yet.
	 */
	public function maybe_register_handlers() {
		if ( ! AndyBZ_Monitor_Connector::instance()->is_connected() ) {
			return;
		}

		set_error_handler( array( $this, 'handle_error' ) );
		register_shutdown_function( array( $this, 'handle_shutdown' ) );
	}

	/**
	 * PHP error handler. Returning false lets PHP's normal error handling
	 * (logging/display) continue unaffected - we only add reporting.
	 */
	public function handle_error( $errno, $errstr, $errfile = '', $errline = 0 ) {
		// Respects @-suppression and the configured error_reporting level.
		if ( ! ( error_reporting() & $errno ) ) {
			return false;
		}

		$event_type = $this->event_type_for_errno( $errno );

		if ( null !== $event_type ) {
			$backtrace = $this->format_backtrace( debug_backtrace( DEBUG_BACKTRACE_IGNORE_ARGS, 6 ) );
			$this->maybe_report( $event_type, $errstr, $errfile, (int) $errline, $backtrace );
		}

		return false;
	}

	/**
	 * Shutdown handler. Catches fatal errors that terminate the script before
	 * a normal error-handler call would have run.
	 */
	public function handle_shutdown() {
		$last_error = error_get_last();

		if ( null === $last_error ) {
			return;
		}

		$fatal_types = array( E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR, E_USER_ERROR );

		if ( ! in_array( $last_error['type'], $fatal_types, true ) ) {
			return;
		}

		$this->maybe_report( 'php_fatal', $last_error['message'], $last_error['file'], (int) $last_error['line'], null );
	}

	private function event_type_for_errno( $errno ) {
		$fatal   = array( E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR, E_USER_ERROR, E_RECOVERABLE_ERROR );
		$warning = array( E_WARNING, E_CORE_WARNING, E_COMPILE_WARNING, E_USER_WARNING );
		$notice  = array( E_NOTICE, E_USER_NOTICE, E_DEPRECATED, E_USER_DEPRECATED, E_STRICT );

		if ( in_array( $errno, $fatal, true ) ) {
			return 'php_fatal';
		}
		if ( in_array( $errno, $warning, true ) ) {
			return 'php_warning';
		}
		if ( in_array( $errno, $notice, true ) ) {
			return 'php_notice';
		}

		return null;
	}

	private function format_backtrace( $trace ) {
		if ( empty( $trace ) ) {
			return null;
		}

		$lines = array();
		foreach ( $trace as $i => $frame ) {
			$location = isset( $frame['file'] ) ? $frame['file'] . ':' . ( $frame['line'] ?? '?' ) : '[internal function]';
			$call     = isset( $frame['class'] ) ? $frame['class'] . $frame['type'] . $frame['function'] : $frame['function'];
			$lines[]  = "#{$i} {$location} {$call}()";
		}

		return implode( "\n", $lines );
	}

	/**
	 * Decide whether this error signature should actually be sent: skips
	 * duplicates already reported this request, and throttles repeats of the
	 * same signature across requests so a hot error path can't flood the
	 * ingestion endpoint or slow the site down.
	 */
	private function maybe_report( $event_type, $message, $file, $line, $backtrace ) {
		if ( $this->is_reporting ) {
			return;
		}

		$signature = md5( $event_type . '|' . $file . '|' . $line . '|' . $message );

		if ( isset( $this->reported_this_request[ $signature ] ) ) {
			return;
		}
		$this->reported_this_request[ $signature ] = true;

		$throttle_key = 'andybz_monitor_evt_' . substr( $signature, 0, 40 );
		if ( false !== get_transient( $throttle_key ) ) {
			return;
		}
		set_transient( $throttle_key, 1, self::THROTTLE_SECONDS );

		$this->is_reporting = true;
		$this->send_event( $event_type, $message, $file, $line, $backtrace );
		$this->is_reporting = false;
	}

	/**
	 * Sends a single event to the monitoring application via the shared
	 * event client. Public so it's directly testable/reusable.
	 *
	 * @return true|WP_Error
	 */
	public function send_event( $event_type, $message, $file = '', $line = 0, $backtrace = null ) {
		$payload = array(
			'eventType'  => $event_type,
			'message'    => $message,
			'file'       => $file ? $file : null,
			'line'       => $line ? $line : null,
			'requestUrl' => AndyBZ_Monitor_Event_Client::current_request_path(),
		);

		if ( $backtrace ) {
			$payload['stackTrace'] = $backtrace;
		}

		return AndyBZ_Monitor_Event_Client::send( $payload );
	}
}
