<?php
/**
 * Plugin Name: AndyBZ Monitor Connector
 * Description: Securely connects this WordPress website to the AndyBZ Website Monitor platform.
 * Version: 0.3.0
 * Requires PHP: 7.4
 * Author: Andy
 * License: GPL-2.0-or-later
 * Text Domain: andybz-monitor-connector
 *
 * @package AndyBZ_Monitor_Connector
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // No direct access.
}

define( 'ANDYBZ_MONITOR_VERSION', '0.3.0' );
define( 'ANDYBZ_MONITOR_OPTION', 'andybz_monitor_connector' );
define( 'ANDYBZ_MONITOR_DEFAULT_APP_URL', 'https://monitor.andybz.com' );
define( 'ANDYBZ_MONITOR_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );

require_once ANDYBZ_MONITOR_PLUGIN_DIR . 'includes/class-andybz-monitor-connector.php';
require_once ANDYBZ_MONITOR_PLUGIN_DIR . 'includes/class-andybz-monitor-heartbeat.php';
require_once ANDYBZ_MONITOR_PLUGIN_DIR . 'includes/class-andybz-monitor-event-client.php';
require_once ANDYBZ_MONITOR_PLUGIN_DIR . 'includes/class-andybz-monitor-error-reporter.php';
require_once ANDYBZ_MONITOR_PLUGIN_DIR . 'includes/class-andybz-monitor-change-tracker.php';
require_once ANDYBZ_MONITOR_PLUGIN_DIR . 'includes/class-andybz-monitor-admin.php';

add_action( 'plugins_loaded', array( 'AndyBZ_Monitor_Connector', 'instance' ) );
add_action( 'plugins_loaded', array( 'AndyBZ_Monitor_Heartbeat', 'instance' ) );
add_action( 'plugins_loaded', array( 'AndyBZ_Monitor_Error_Reporter', 'instance' ) );
add_action( 'plugins_loaded', array( 'AndyBZ_Monitor_Change_Tracker', 'instance' ) );
add_action( 'plugins_loaded', array( 'AndyBZ_Monitor_Admin', 'instance' ) );

register_activation_hook( __FILE__, array( 'AndyBZ_Monitor_Heartbeat', 'activate' ) );
register_deactivation_hook( __FILE__, array( 'AndyBZ_Monitor_Heartbeat', 'deactivate' ) );
