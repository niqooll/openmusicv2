//src/services/postgres/PlaylistsServices.js
const { nanoid } = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const AuthorizationError = require('../../exceptions/AuthorizationError');
const { createPool } = require('../../utils/database');

class PlaylistsService {
  constructor(collaborationService) {
    this._pool = createPool();
    this._collaborationService = collaborationService;
  }

  async addPlaylist({ name, owner }) {
    const id = `playlist-${nanoid(16)}`;
    const query = {
      text: 'INSERT INTO playlists VALUES($1, $2, $3) RETURNING id',
      values: [id, name, owner],
    };
    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Playlist gagal ditambahkan');
    }
    return result.rows[0].id;
  }

  async getPlaylists(owner) {
    const query = {
      text: `SELECT playlists.id, playlists.name, users.username FROM playlists
             LEFT JOIN collaborations ON collaborations.playlist_id = playlists.id
             LEFT JOIN users ON users.id = playlists.owner
             WHERE playlists.owner = $1 OR collaborations.user_id = $1
             GROUP BY playlists.id, users.username`,
      values: [owner],
    };
    const result = await this._pool.query(query);
    return result.rows;
  }

  async deletePlaylistById(id) {
    const query = {
      text: 'DELETE FROM playlists WHERE id = $1 RETURNING id',
      values: [id],
    };
    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new NotFoundError('Playlist gagal dihapus. Id tidak ditemukan');
    }
  }

  async addSongToPlaylist(playlistId, songId, userId) {
    // verifikasi songId
    const songQuery = {
      text: 'SELECT id FROM songs WHERE id = $1',
      values: [songId],
    };
    const songResult = await this._pool.query(songQuery);
    if (songResult.rows.length === 0) {
      throw new NotFoundError('Lagu tidak ditemukan');
    }

    const id = `psong-${nanoid(16)}`;
    const query = {
      text: 'INSERT INTO playlist_songs (id, playlist_id, song_id) VALUES($1, $2, $3) RETURNING id',
      values: [id, playlistId, songId],
    };
    const result = await this._pool.query(query);
    if (!result.rows[0].id) {
      throw new InvariantError('Lagu gagal ditambahkan ke playlist');
    }

    // Mencatat aktivitas
    await this.addPlaylistActivity(playlistId, songId, userId, 'add');
  }

  async getSongsFromPlaylist(playlistId) {
    const playlistQuery = {
      text: `SELECT p.id, p.name, u.username
               FROM playlists p
               JOIN users u ON p.owner = u.id
               WHERE p.id = $1`,
      values: [playlistId],
    };

    const songsQuery = {
      text: `SELECT s.id, s.title, s.performer
               FROM songs s
               JOIN playlist_songs ps ON s.id = ps.song_id
               WHERE ps.playlist_id = $1`,
      values: [playlistId],
    };

    const playlistResult = await this._pool.query(playlistQuery);
    if (playlistResult.rows.length === 0) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }

    const songsResult = await this._pool.query(songsQuery);

    const playlist = playlistResult.rows[0];
    playlist.songs = songsResult.rows;

    return playlist;
  }

  async deleteSongFromPlaylist(playlistId, songId, userId) {
    const query = {
      text: 'DELETE FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2 RETURNING id',
      values: [playlistId, songId],
    };
    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new InvariantError('Lagu gagal dihapus dari playlist');
    }

    // Mencatat aktivitas
    await this.addPlaylistActivity(playlistId, songId, userId, 'delete');
  }

  async verifyPlaylistOwner(id, owner) {
    const query = {
      text: 'SELECT * FROM playlists WHERE id = $1',
      values: [id],
    };
    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }
    const playlist = result.rows[0];
    if (playlist.owner !== owner) {
      throw new AuthorizationError('Anda tidak berhak mengakses resource ini');
    }
  }

  async verifyPlaylistAccess(playlistId, userId) {
    try {
      await this.verifyPlaylistOwner(playlistId, userId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      try {
        await this._collaborationService.verifyCollaborator(playlistId, userId);
      } catch {
        throw error;
      }
    }
  }

  async addPlaylistActivity(playlistId, songId, userId, action) {
    const id = `activity-${nanoid(16)}`;
    const time = new Date().toISOString();
    const query = {
      text: `INSERT INTO playlist_song_activities 
             (id, playlist_id, song_id, user_id, action, time) 
             VALUES ($1, $2, $3, $4, $5, $6)`,
      values: [id, playlistId, songId, userId, action, time],
    };
    await this._pool.query(query);
  }

  async getPlaylistActivities(playlistId) {
    const query = {
      text: `SELECT u.username, s.title, psa.action, psa.time
             FROM playlist_song_activities psa
             JOIN users u ON psa.user_id = u.id
             JOIN songs s ON psa.song_id = s.id
             WHERE psa.playlist_id = $1
             ORDER BY psa.time ASC`,
      values: [playlistId],
    };
    const result = await this._pool.query(query);
    return result.rows;
  }

  // Method untuk export playlist
  async getPlaylistById(playlistId) {
    const playlistQuery = {
      text: `SELECT p.id, p.name
               FROM playlists p
               WHERE p.id = $1`,
      values: [playlistId],
    };

    const songsQuery = {
      text: `SELECT s.id, s.title, s.performer
               FROM songs s
               JOIN playlist_songs ps ON s.id = ps.song_id
               WHERE ps.playlist_id = $1`,
      values: [playlistId],
    };

    const playlistResult = await this._pool.query(playlistQuery);
    if (playlistResult.rows.length === 0) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }

    const songsResult = await this._pool.query(songsQuery);

    return {
      playlist: {
        id: playlistResult.rows[0].id,
        name: playlistResult.rows[0].name,
        songs: songsResult.rows,
      },
    };
  }
}

module.exports = PlaylistsService;