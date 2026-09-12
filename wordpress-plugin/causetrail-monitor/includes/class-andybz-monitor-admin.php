<?php
/**
 * Settings → CauseTrail admin page.
 *
 * @package AndyBZ_Monitor_Connector
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class AndyBZ_Monitor_Admin {

	/**
	 * @var AndyBZ_Monitor_Admin|null
	 */
	private static $instance = null;

	public static function instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	private function __construct() {
		add_action( 'admin_menu', array( $this, 'register_menu' ) );
		add_action( 'admin_post_andybz_monitor_connect', array( $this, 'handle_connect' ) );
		add_action( 'admin_post_andybz_monitor_disconnect', array( $this, 'handle_disconnect' ) );
		add_action( 'admin_post_andybz_monitor_test_heartbeat', array( $this, 'handle_test_heartbeat' ) );
		add_action( 'admin_init', array( $this, 'maybe_redirect_after_activation' ) );
		add_filter( 'plugin_action_links_' . ANDYBZ_MONITOR_PLUGIN_BASENAME, array( $this, 'add_settings_link' ) );
	}

	/**
	 * Flags a redirect-to-settings on the next admin page load after activation.
	 */
	public static function activate() {
		set_transient( 'andybz_monitor_activation_redirect', true, 30 );
	}

	/**
	 * Sends the admin to the settings page right after activating the plugin.
	 * Skipped for bulk activations, since redirecting would only work for one plugin.
	 */
	public function maybe_redirect_after_activation() {
		if ( ! get_transient( 'andybz_monitor_activation_redirect' ) ) {
			return;
		}

		delete_transient( 'andybz_monitor_activation_redirect' );

		if ( wp_doing_ajax() || isset( $_GET['activate-multi'] ) ) {
			return;
		}

		wp_safe_redirect( admin_url( 'options-general.php?page=causetrail-monitor' ) );
		exit;
	}

	/**
	 * Adds a "Settings" link next to Activate/Deactivate on the Plugins list.
	 *
	 * @param array $links Existing action links.
	 * @return array
	 */
	public function add_settings_link( $links ) {
		$settings_link = sprintf(
			'<a href="%s">%s</a>',
			esc_url( admin_url( 'options-general.php?page=causetrail-monitor' ) ),
			esc_html__( 'Settings', 'causetrail-monitor' )
		);

		array_unshift( $links, $settings_link );

		return $links;
	}

	public function register_menu() {
		add_options_page(
			__( 'CauseTrail', 'causetrail-monitor' ),
			__( 'CauseTrail', 'causetrail-monitor' ),
			'manage_options',
			'causetrail-monitor',
			array( $this, 'render_page' )
		);
	}

	public function render_page() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}

		$connector = AndyBZ_Monitor_Connector::instance();
		$settings  = $connector->get_settings();
		$connected = $connector->is_connected();
		?>
		<div class="wrap">
			<h1><?php esc_html_e( 'CauseTrail', 'causetrail-monitor' ); ?></h1>

			<p>
				<a
					href="<?php echo esc_url( $settings['app_url'] ); ?>"
					class="button button-secondary"
					target="_blank"
					rel="noopener noreferrer"
				>
					<?php esc_html_e( 'View CauseTrail Dashboard', 'causetrail-monitor' ); ?> &#8599;
				</a>
			</p>

			<?php if ( isset( $_GET['andybz_monitor_error'] ) ) : ?>
				<div class="notice notice-error">
					<p><?php echo esc_html( sanitize_text_field( wp_unslash( $_GET['andybz_monitor_error'] ) ) ); ?></p>
				</div>
			<?php endif; ?>

			<?php if ( isset( $_GET['andybz_monitor_connected'] ) ) : ?>
				<div class="notice notice-success">
					<p><?php esc_html_e( 'Connected successfully.', 'causetrail-monitor' ); ?></p>
				</div>
			<?php endif; ?>

			<?php if ( isset( $_GET['andybz_monitor_heartbeat_sent'] ) ) : ?>
				<div class="notice notice-success">
					<p><?php esc_html_e( 'Heartbeat sent successfully.', 'causetrail-monitor' ); ?></p>
				</div>
			<?php endif; ?>

			<?php if ( $connected ) : ?>
				<p>
					<strong style="color:#1a7f37;">&#10003; <?php esc_html_e( 'Connected', 'causetrail-monitor' ); ?></strong>
				</p>
				<table class="form-table" role="presentation">
					<tr>
						<th scope="row"><?php esc_html_e( 'Monitoring application', 'causetrail-monitor' ); ?></th>
						<td><?php echo esc_html( $settings['app_url'] ); ?></td>
					</tr>
					<tr>
						<th scope="row"><?php esc_html_e( 'Site ID', 'causetrail-monitor' ); ?></th>
						<td><code><?php echo esc_html( $settings['site_id'] ); ?></code></td>
					</tr>
				</table>

				<?php $performance_error = AndyBZ_Monitor_Performance::instance()->get_last_error(); ?>
				<?php if ( $performance_error ) : ?>
					<div class="notice notice-warning inline">
						<p>
							<strong><?php esc_html_e( 'Performance check failing:', 'causetrail-monitor' ); ?></strong>
							<?php echo esc_html( $performance_error ); ?>
							<?php esc_html_e( 'The Performance tab on your dashboard may be missing recent data until this resolves.', 'causetrail-monitor' ); ?>
						</p>
					</div>
				<?php endif; ?>

				<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" style="display:inline-block;margin-right:8px;">
					<?php wp_nonce_field( 'andybz_monitor_test_heartbeat' ); ?>
					<input type="hidden" name="action" value="andybz_monitor_test_heartbeat" />
					<?php submit_button( __( 'Send Heartbeat Now', 'causetrail-monitor' ), 'secondary', 'submit', false ); ?>
				</form>

				<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" style="display:inline-block;">
					<?php wp_nonce_field( 'andybz_monitor_disconnect' ); ?>
					<input type="hidden" name="action" value="andybz_monitor_disconnect" />
					<?php submit_button( __( 'Disconnect', 'causetrail-monitor' ), 'delete', 'submit', false ); ?>
				</form>
			<?php else : ?>
				<div class="notice notice-info" style="padding:12px 16px;">
					<p><strong><?php esc_html_e( 'How to get a connection key:', 'causetrail-monitor' ); ?></strong></p>
					<ol style="margin-left:1.2em;list-style:decimal;">
						<li><?php esc_html_e( 'Log in to your CauseTrail dashboard.', 'causetrail-monitor' ); ?></li>
						<li><?php esc_html_e( 'Open this website (or add it, if it is not listed yet).', 'causetrail-monitor' ); ?></li>
						<li><?php esc_html_e( 'Go to the Connect tab and click "Generate Connection Key".', 'causetrail-monitor' ); ?></li>
						<li><?php esc_html_e( 'Copy the key it shows you and paste it below.', 'causetrail-monitor' ); ?></li>
					</ol>
				</div>

				<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
					<?php wp_nonce_field( 'andybz_monitor_connect' ); ?>
					<input type="hidden" name="action" value="andybz_monitor_connect" />
					<table class="form-table" role="presentation">
						<tr>
							<th scope="row">
								<label for="andybz_monitor_app_url"><?php esc_html_e( 'Monitoring application URL', 'causetrail-monitor' ); ?></label>
							</th>
							<td>
								<input
									type="url"
									id="andybz_monitor_app_url"
									name="app_url"
									class="regular-text"
									value="<?php echo esc_attr( $settings['app_url'] ); ?>"
									required
								/>
							</td>
						</tr>
						<tr>
							<th scope="row">
								<label for="andybz_monitor_pairing_token"><?php esc_html_e( 'Connection key', 'causetrail-monitor' ); ?></label>
							</th>
							<td>
								<input
									type="text"
									id="andybz_monitor_pairing_token"
									name="pairing_token"
									class="regular-text"
									placeholder="ABZ-XXXXXXXXXXXXXXXX"
									autocomplete="off"
									required
								/>
							</td>
						</tr>
					</table>
					<?php submit_button( __( 'Connect', 'causetrail-monitor' ) ); ?>
				</form>
			<?php endif; ?>
		</div>
		<?php
	}

	public function handle_connect() {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( esc_html__( 'You do not have permission to do this.', 'causetrail-monitor' ) );
		}

		check_admin_referer( 'andybz_monitor_connect' );

		$app_url       = isset( $_POST['app_url'] ) ? sanitize_text_field( wp_unslash( $_POST['app_url'] ) ) : '';
		$pairing_token = isset( $_POST['pairing_token'] ) ? sanitize_text_field( wp_unslash( $_POST['pairing_token'] ) ) : '';

		$result = AndyBZ_Monitor_Connector::instance()->connect( $app_url, $pairing_token );

		$redirect_url = admin_url( 'options-general.php?page=causetrail-monitor' );

		if ( is_wp_error( $result ) ) {
			$redirect_url = add_query_arg( 'andybz_monitor_error', rawurlencode( $result->get_error_message() ), $redirect_url );
		} else {
			$redirect_url = add_query_arg( 'andybz_monitor_connected', '1', $redirect_url );
		}

		wp_safe_redirect( $redirect_url );
		exit;
	}

	public function handle_disconnect() {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( esc_html__( 'You do not have permission to do this.', 'causetrail-monitor' ) );
		}

		check_admin_referer( 'andybz_monitor_disconnect' );

		AndyBZ_Monitor_Connector::instance()->disconnect();

		wp_safe_redirect( admin_url( 'options-general.php?page=causetrail-monitor' ) );
		exit;
	}

	public function handle_test_heartbeat() {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( esc_html__( 'You do not have permission to do this.', 'causetrail-monitor' ) );
		}

		check_admin_referer( 'andybz_monitor_test_heartbeat' );

		$result = AndyBZ_Monitor_Heartbeat::instance()->send_heartbeat();

		$redirect_url = admin_url( 'options-general.php?page=causetrail-monitor' );

		if ( is_wp_error( $result ) ) {
			$redirect_url = add_query_arg( 'andybz_monitor_error', rawurlencode( $result->get_error_message() ), $redirect_url );
		} else {
			$redirect_url = add_query_arg( 'andybz_monitor_heartbeat_sent', '1', $redirect_url );
		}

		wp_safe_redirect( $redirect_url );
		exit;
	}
}
