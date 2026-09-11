<?php
/**
 * Tracks WordPress changes (plugin/theme/core updates), account activity
 * (logins, user create/delete/role changes), content changes (post/page
 * publish/update/trash/delete), failed logins, and 404s, reporting them as
 * monitoring events.
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

	/** Post types worth reporting content changes for - skip custom post types/attachments. */
	const TRACKED_POST_TYPES = array( 'post', 'page' );

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

		add_action( 'wp_login', array( $this, 'on_login' ), 10, 2 );
		add_action( 'user_register', array( $this, 'on_user_registered' ) );
		add_action( 'deleted_user', array( $this, 'on_user_deleted' ), 10, 3 );
		add_action( 'set_user_role', array( $this, 'on_user_role_changed' ), 10, 3 );

		add_action( 'transition_post_status', array( $this, 'on_post_status_transition' ), 10, 3 );
		add_action( 'post_updated', array( $this, 'on_post_updated' ), 10, 3 );
		add_action( 'before_delete_post', array( $this, 'on_post_deleted' ) );
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

	/**
	 * @param string  $user_login
	 * @param WP_User $user
	 */
	public function on_login( $user_login, $user ) {
		$role = ! empty( $user->roles ) ? $user->roles[0] : 'subscriber';

		AndyBZ_Monitor_Event_Client::send(
			array(
				'eventType' => 'user_login',
				'category'  => 'account',
				'message'   => sprintf( '%s logged in', $user_login ),
				'metadata'  => array(
					'username'  => sanitize_text_field( $user_login ),
					'role'      => $role,
					'ipAddress' => AndyBZ_Monitor_Event_Client::current_client_ip(),
				),
			)
		);
	}

	public function on_user_registered( $user_id ) {
		$user = get_userdata( $user_id );
		if ( ! $user ) {
			return;
		}
		$role = ! empty( $user->roles ) ? $user->roles[0] : 'subscriber';

		AndyBZ_Monitor_Event_Client::send(
			array(
				'eventType' => 'user_registered',
				'category'  => 'account',
				'message'   => sprintf( 'New user account created: %s (%s)', $user->user_login, $role ),
				'metadata'  => array(
					'username' => $user->user_login,
					'role'     => $role,
				),
			)
		);
	}

	/**
	 * @param int          $id
	 * @param int|null     $reassign
	 * @param WP_User|null $user The now-deleted user, if still available.
	 */
	public function on_user_deleted( $id, $reassign, $user ) {
		$username = $user && ! empty( $user->user_login ) ? $user->user_login : "user #{$id}";

		AndyBZ_Monitor_Event_Client::send(
			array(
				'eventType' => 'user_deleted',
				'category'  => 'account',
				'message'   => sprintf( 'User account removed: %s', $username ),
			)
		);
	}

	/**
	 * @param int    $user_id
	 * @param string $role     The new role.
	 * @param array  $old_roles Roles the user had before this change.
	 */
	public function on_user_role_changed( $user_id, $role, $old_roles ) {
		// Empty $old_roles means this is the initial role assignment during
		// registration (set_user_role also fires then), not a later change.
		if ( empty( $old_roles ) || in_array( $role, $old_roles, true ) ) {
			return;
		}

		$user     = get_userdata( $user_id );
		$username = $user ? $user->user_login : "user #{$user_id}";

		AndyBZ_Monitor_Event_Client::send(
			array(
				'eventType' => 'user_role_changed',
				'category'  => 'account',
				'message'   => sprintf( "%s's role changed to %s", $username, $role ),
				'metadata'  => array(
					'username'      => $username,
					'newRole'       => $role,
					'previousRoles' => array_values( $old_roles ),
				),
			)
		);
	}

	/**
	 * @param string  $new_status
	 * @param string  $old_status
	 * @param WP_Post $post
	 */
	public function on_post_status_transition( $new_status, $old_status, $post ) {
		if ( $new_status === $old_status || ! in_array( $post->post_type, self::TRACKED_POST_TYPES, true ) ) {
			return;
		}
		if ( wp_is_post_revision( $post ) || wp_is_post_autosave( $post ) ) {
			return;
		}

		$label = 'page' === $post->post_type ? 'Page' : 'Post';
		$title = $post->post_title ? $post->post_title : '(no title)';

		if ( 'publish' === $new_status ) {
			$event_type = 'content_published';
			$message    = sprintf( '%s published: %s', $label, $title );
		} elseif ( 'publish' === $old_status && 'trash' !== $new_status ) {
			$event_type = 'content_unpublished';
			$message    = sprintf( '%s unpublished: %s', $label, $title );
		} elseif ( 'trash' === $new_status ) {
			$event_type = 'content_trashed';
			$message    = sprintf( '%s moved to trash: %s', $label, $title );
		} else {
			// e.g. auto-draft -> draft - not worth reporting.
			return;
		}

		AndyBZ_Monitor_Event_Client::send(
			array(
				'eventType' => $event_type,
				'category'  => 'content',
				'message'   => $message,
			)
		);
	}

	/**
	 * Edits to already-published content. Creation/publish/unpublish/trash
	 * are all reported via on_post_status_transition() instead, so this only
	 * fires for a real edit to content that was already live.
	 *
	 * @param int     $post_id
	 * @param WP_Post $post_after
	 * @param WP_Post $post_before
	 */
	public function on_post_updated( $post_id, $post_after, $post_before ) {
		if ( ! in_array( $post_after->post_type, self::TRACKED_POST_TYPES, true ) ) {
			return;
		}
		if ( 'publish' !== $post_after->post_status || 'publish' !== $post_before->post_status ) {
			return;
		}
		if ( wp_is_post_revision( $post_id ) || wp_is_post_autosave( $post_id ) ) {
			return;
		}

		$label = 'page' === $post_after->post_type ? 'Page' : 'Post';

		AndyBZ_Monitor_Event_Client::send(
			array(
				'eventType' => 'content_updated',
				'category'  => 'content',
				'message'   => sprintf( '%s updated: %s', $label, $post_after->post_title ? $post_after->post_title : '(no title)' ),
			)
		);
	}

	public function on_post_deleted( $post_id ) {
		$post = get_post( $post_id );
		if ( ! $post || ! in_array( $post->post_type, self::TRACKED_POST_TYPES, true ) ) {
			return;
		}
		if ( wp_is_post_revision( $post_id ) || wp_is_post_autosave( $post_id ) ) {
			return;
		}

		$label = 'page' === $post->post_type ? 'Page' : 'Post';

		AndyBZ_Monitor_Event_Client::send(
			array(
				'eventType' => 'content_deleted',
				'category'  => 'content',
				'message'   => sprintf( '%s permanently deleted: %s', $label, $post->post_title ? $post->post_title : '(no title)' ),
			)
		);
	}

	public function on_template_redirect() {
		if ( ! is_404() ) {
			return;
		}

		$path = AndyBZ_Monitor_Event_Client::current_request_path();
		$top_paths = $this->track_404_path( $path ? $path : '(unknown)' );

		AndyBZ_Monitor_Event_Client::send(
			array(
				'eventType'  => 'http_404',
				'category'   => 'error',
				// Deliberately NOT path-specific (unlike other event types) - real
				// sites see hundreds of distinct bot-probed paths (wp-config.php,
				// .env, random plugin slugs, etc.) that would otherwise each
				// become their own issue and flood the Issues list. All 404s on
				// a site consolidate into one issue; the specific paths are
				// still visible via requestUrl (most recent) and metadata (top
				// offenders), same pattern as failed_login's throttled grouping.
				'message'    => 'Pages not found are being requested on this website',
				'requestUrl' => $path,
				'metadata'   => array(
					'topPaths' => $top_paths,
				),
			)
		);
	}

	/**
	 * Rolling tally of the most-requested 404 paths, so the single grouped
	 * issue can still show what's actually being hit (e.g. a legitimate
	 * broken internal link vs. bot scanning for vulnerable file paths).
	 * Stored in a transient (not an option) since it's disposable, high-churn
	 * data - resets itself every 7 days rather than growing forever.
	 *
	 * @return array List of ['path' => string, 'count' => int], top 10 by count.
	 */
	private function track_404_path( $path ) {
		$transient_key = 'andybz_monitor_404_paths';
		$tally         = get_transient( $transient_key );
		if ( ! is_array( $tally ) ) {
			$tally = array();
		}

		$path = mb_substr( $path, 0, 300 );
		$tally[ $path ] = ( isset( $tally[ $path ] ) ? $tally[ $path ] : 0 ) + 1;

		// Cap distinct paths tracked so a determined scanner can't grow this
		// transient unbounded - keep only the most frequent ones.
		if ( count( $tally ) > 100 ) {
			arsort( $tally );
			$tally = array_slice( $tally, 0, 100, true );
		}

		set_transient( $transient_key, $tally, 7 * DAY_IN_SECONDS );

		arsort( $tally );
		$top = array();
		foreach ( array_slice( $tally, 0, 10, true ) as $top_path => $count ) {
			$top[] = array(
				'path'  => $top_path,
				'count' => $count,
			);
		}
		return $top;
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
