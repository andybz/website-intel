<?php
/**
 * Plugin Name: CauseTrail
 * Description: Securely connects this WordPress website to your CauseTrail monitoring dashboard.
 * Version: 0.10.0
 * Requires PHP: 7.4
 * Author: AndyBZ Creative
 * Author URI: https://andybz.com
 * License: GPL-2.0-or-later
 * Text Domain: causetrail-monitor
 *
 * @package AndyBZ_Monitor_Connector
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // No direct access.
}

define( 'ANDYBZ_MONITOR_VERSION', '0.10.0' );
// Unchanged on purpose across the causetrail-monitor rename - this is the
// wp_options key already stored on every connected site, so keeping the old
// value here preserves each site's existing pairing/connection state.
define( 'ANDYBZ_MONITOR_OPTION', 'andybz_monitor_connector' );
define( 'ANDYBZ_MONITOR_DEFAULT_APP_URL', 'https://monitor.andybz.com' );
define( 'ANDYBZ_MONITOR_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'ANDYBZ_MONITOR_PLUGIN_BASENAME', plugin_basename( __FILE__ ) );

require_once ANDYBZ_MONITOR_PLUGIN_DIR . 'includes/class-andybz-monitor-connector.php';
require_once ANDYBZ_MONITOR_PLUGIN_DIR . 'includes/class-andybz-monitor-heartbeat.php';
require_once ANDYBZ_MONITOR_PLUGIN_DIR . 'includes/class-andybz-monitor-event-client.php';
require_once ANDYBZ_MONITOR_PLUGIN_DIR . 'includes/class-andybz-monitor-error-reporter.php';
require_once ANDYBZ_MONITOR_PLUGIN_DIR . 'includes/class-andybz-monitor-change-tracker.php';
require_once ANDYBZ_MONITOR_PLUGIN_DIR . 'includes/class-andybz-monitor-traffic.php';
require_once ANDYBZ_MONITOR_PLUGIN_DIR . 'includes/class-andybz-monitor-performance.php';
require_once ANDYBZ_MONITOR_PLUGIN_DIR . 'includes/class-andybz-monitor-admin.php';
require_once ANDYBZ_MONITOR_PLUGIN_DIR . 'vendor/plugin-update-checker/plugin-update-checker.php';

add_action( 'plugins_loaded', array( 'AndyBZ_Monitor_Connector', 'instance' ) );
add_action( 'plugins_loaded', array( 'AndyBZ_Monitor_Heartbeat', 'instance' ) );
add_action( 'plugins_loaded', array( 'AndyBZ_Monitor_Error_Reporter', 'instance' ) );
add_action( 'plugins_loaded', array( 'AndyBZ_Monitor_Change_Tracker', 'instance' ) );
add_action( 'plugins_loaded', array( 'AndyBZ_Monitor_Traffic', 'instance' ) );
add_action( 'plugins_loaded', array( 'AndyBZ_Monitor_Admin', 'instance' ) );

// Self-hosted update checking (README: this plugin is private, not on
// wordpress.org) - checks our own server for a JSON manifest instead. Works
// regardless of pairing status, so it must not be gated behind is_connected().
add_action(
	'plugins_loaded',
	function () {
		if ( ! class_exists( 'YahnisElsts\PluginUpdateChecker\v5\PucFactory' ) ) {
			return;
		}

		$app_url = AndyBZ_Monitor_Connector::instance()->get_settings()['app_url'];

		YahnisElsts\PluginUpdateChecker\v5\PucFactory::buildUpdateChecker(
			untrailingslashit( $app_url ) . '/downloads/causetrail-monitor.json',
			__FILE__,
			'causetrail-monitor'
		);
	}
);

register_activation_hook( __FILE__, array( 'AndyBZ_Monitor_Heartbeat', 'activate' ) );
register_activation_hook( __FILE__, array( 'AndyBZ_Monitor_Admin', 'activate' ) );
register_deactivation_hook( __FILE__, array( 'AndyBZ_Monitor_Heartbeat', 'deactivate' ) );
