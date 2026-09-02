<?php
/**
 * Settings → Monitor Connector admin page.
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
	}

	public function register_menu() {
		add_options_page(
			__( 'Monitor Connector', 'andybz-monitor-connector' ),
			__( 'Monitor Connector', 'andybz-monitor-connector' ),
			'manage_options',
			'andybz-monitor-connector',
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
			<h1><?php esc_html_e( 'Monitor Connector', 'andybz-monitor-connector' ); ?></h1>

			<?php if ( isset( $_GET['andybz_monitor_error'] ) ) : ?>
				<div class="notice notice-error">
					<p><?php echo esc_html( sanitize_text_field( wp_unslash( $_GET['andybz_monitor_error'] ) ) ); ?></p>
				</div>
			<?php endif; ?>

			<?php if ( isset( $_GET['andybz_monitor_connected'] ) ) : ?>
				<div class="notice notice-success">
					<p><?php esc_html_e( 'Connected successfully.', 'andybz-monitor-connector' ); ?></p>
				</div>
			<?php endif; ?>

			<?php if ( isset( $_GET['andybz_monitor_heartbeat_sent'] ) ) : ?>
				<div class="notice notice-success">
					<p><?php esc_html_e( 'Heartbeat sent successfully.', 'andybz-monitor-connector' ); ?></p>
				</div>
			<?php endif; ?>

			<?php if ( $connected ) : ?>
				<p>
					<strong style="color:#1a7f37;">&#10003; <?php esc_html_e( 'Connected', 'andybz-monitor-connector' ); ?></strong>
				</p>
				<table class="form-table" role="presentation">
					<tr>
						<th scope="row"><?php esc_html_e( 'Monitoring application', 'andybz-monitor-connector' ); ?></th>
						<td><?php echo esc_html( $settings['app_url'] ); ?></td>
					</tr>
					<tr>
						<th scope="row"><?php esc_html_e( 'Site ID', 'andybz-monitor-connector' ); ?></th>
						<td><code><?php echo esc_html( $settings['site_id'] ); ?></code></td>
					</tr>
				</table>

				<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" style="display:inline-block;margin-right:8px;">
					<?php wp_nonce_field( 'andybz_monitor_test_heartbeat' ); ?>
					<input type="hidden" name="action" value="andybz_monitor_test_heartbeat" />
					<?php submit_button( __( 'Send Heartbeat Now', 'andybz-monitor-connector' ), 'secondary', 'submit', false ); ?>
				</form>

				<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" style="display:inline-block;">
					<?php wp_nonce_field( 'andybz_monitor_disconnect' ); ?>
					<input type="hidden" name="action" value="andybz_monitor_disconnect" />
					<?php submit_button( __( 'Disconnect', 'andybz-monitor-connector' ), 'delete', 'submit', false ); ?>
				</form>
			<?php else : ?>
				<p>
					<?php esc_html_e( 'Paste the connection key shown in your Website Monitor dashboard to connect this website.', 'andybz-monitor-connector' ); ?>
				</p>

				<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
					<?php wp_nonce_field( 'andybz_monitor_connect' ); ?>
					<input type="hidden" name="action" value="andybz_monitor_connect" />
					<table class="form-table" role="presentation">
						<tr>
							<th scope="row">
								<label for="andybz_monitor_app_url"><?php esc_html_e( 'Monitoring application URL', 'andybz-monitor-connector' ); ?></label>
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
								<label for="andybz_monitor_pairing_token"><?php esc_html_e( 'Connection key', 'andybz-monitor-connector' ); ?></label>
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
					<?php submit_button( __( 'Connect', 'andybz-monitor-connector' ) ); ?>
				</form>
			<?php endif; ?>
		</div>
		<?php
	}

	public function handle_connect() {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( esc_html__( 'You do not have permission to do this.', 'andybz-monitor-connector' ) );
		}

		check_admin_referer( 'andybz_monitor_connect' );

		$app_url       = isset( $_POST['app_url'] ) ? sanitize_text_field( wp_unslash( $_POST['app_url'] ) ) : '';
		$pairing_token = isset( $_POST['pairing_token'] ) ? sanitize_text_field( wp_unslash( $_POST['pairing_token'] ) ) : '';

		$result = AndyBZ_Monitor_Connector::instance()->connect( $app_url, $pairing_token );

		$redirect_url = admin_url( 'options-general.php?page=andybz-monitor-connector' );

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
			wp_die( esc_html__( 'You do not have permission to do this.', 'andybz-monitor-connector' ) );
		}

		check_admin_referer( 'andybz_monitor_disconnect' );

		AndyBZ_Monitor_Connector::instance()->disconnect();

		wp_safe_redirect( admin_url( 'options-general.php?page=andybz-monitor-connector' ) );
		exit;
	}

	public function handle_test_heartbeat() {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( esc_html__( 'You do not have permission to do this.', 'andybz-monitor-connector' ) );
		}

		check_admin_referer( 'andybz_monitor_test_heartbeat' );

		$result = AndyBZ_Monitor_Heartbeat::instance()->send_heartbeat();

		$redirect_url = admin_url( 'options-general.php?page=andybz-monitor-connector' );

		if ( is_wp_error( $result ) ) {
			$redirect_url = add_query_arg( 'andybz_monitor_error', rawurlencode( $result->get_error_message() ), $redirect_url );
		} else {
			$redirect_url = add_query_arg( 'andybz_monitor_heartbeat_sent', '1', $redirect_url );
		}

		wp_safe_redirect( $redirect_url );
		exit;
	}
}
