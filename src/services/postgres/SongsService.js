const { nanoid } = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const { sanitizeSearchQuery } = require('../../utils/inputSanitizer');
const { createPool } = require('../../utils/database');

class SongsService {
  constructor() {
    this._pool = createPool();
  }

  async addSong({
    title, year, genre, performer, duration, albumId,
  }) {
    // Validasi albumId tetap penting
    if (albumId && albumId.trim() !== '') {
      const albumQuery = {
        text: 'SELECT id FROM albums WHERE id = $1',
        values: [albumId],
      };
      const albumResult = await this._pool.query(albumQuery);
      if (albumResult.rows.length === 0) {
        throw new InvariantError('Album tidak ditemukan');
      }
    }

    const id = `song-${nanoid(16)}`;
    const query = {
      // Praktik terbaik: Sebutkan nama kolom secara eksplisit
      text: `INSERT INTO songs(id, title, year, genre, performer, duration, album_id) 
       VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      values: [id, title, year, genre, performer, duration, albumId],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Lagu gagal ditambahkan');
    }

    return result.rows[0].id;
  }

  async getSongs(title = '', performer = '') {
    const sanitizedTitle = sanitizeSearchQuery(title);
    const sanitizedPerformer = sanitizeSearchQuery(performer);

    const query = {
      text: 'SELECT id, title, performer FROM songs WHERE title ILIKE $1 AND performer ILIKE $2',
      values: [`%${sanitizedTitle}%`, `%${sanitizedPerformer}%`],
    };
    const { rows } = await this._pool.query(query);
    return rows;
  }

  async getSongById(id) {
    const query = {
      text: 'SELECT * FROM songs WHERE id = $1',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (result.rows.length === 0) {
      throw new NotFoundError('Lagu tidak ditemukan');
    }

    // Mapping properti dari snake_case (album_id) ke camelCase (albumId)
    const song = result.rows[0];
    return {
      id: song.id,
      title: song.title,
      year: song.year,
      performer: song.performer,
      genre: song.genre,
      duration: song.duration,
      albumId: song.album_id,
    };
  }

  async editSongById(id, {
    title, year, genre, performer, duration, albumId,
  }) {
    if (albumId) {
      const albumQuery = {
        text: 'SELECT id FROM albums WHERE id = $1',
        values: [albumId],
      };
      const albumResult = await this._pool.query(albumQuery);
      if (albumResult.rows.length === 0) {
        throw new NotFoundError('Album tidak ditemukan saat akan memperbarui lagu');
      }
    }

    const query = {
      text: `UPDATE songs SET title = $1, year = $2, genre = $3, performer = $4, 
       duration = $5, album_id = $6 WHERE id = $7 RETURNING id`,
      values: [title, year, genre, performer, duration, albumId, id],
    };

    const result = await this._pool.query(query);

    if (result.rows.length === 0) {
      throw new NotFoundError('Gagal memperbarui lagu. Id tidak ditemukan');
    }
  }

  async deleteSongById(id) {
    const query = {
      text: 'DELETE FROM songs WHERE id = $1 RETURNING id',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (result.rows.length === 0) {
      throw new NotFoundError('Lagu gagal dihapus. Id tidak ditemukan');
    }
  }
}

module.exports = SongsService;
