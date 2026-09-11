<?php
/**
 * Fired when the plugin is uninstalled. Removes stored credentials.
 *
 * @package AndyBZ_Monitor_Connector
 */

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

delete_option( 'andybz_monitor_connector' );
