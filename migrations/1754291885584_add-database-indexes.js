/* eslint-disable camelcase */

exports.up = (pgm) => {
  // Create GIN indexes for songs title and performer using raw SQL
  pgm.sql("CREATE INDEX songs_title_index ON songs USING GIN (title gin_trgm_ops)");
  pgm.sql("CREATE INDEX songs_performer_index ON songs USING GIN (performer gin_trgm_ops)");

  // Create standard B-Tree indexes for foreign keys and common lookups
  pgm.createIndex('songs', 'album_id');
  pgm.createIndex('playlists', 'owner');
  pgm.createIndex('playlist_songs', 'playlist_id');
  pgm.createIndex('playlist_songs', 'song_id');
  pgm.createIndex('collaborations', ['playlist_id', 'user_id']);
  pgm.createIndex('playlist_song_activities', 'playlist_id');
  pgm.createIndex('users', 'username');
};

exports.down = (pgm) => {
  // Drop all indexes created in the up function
  pgm.dropIndex('songs', [], { name: 'songs_title_index' });
  pgm.dropIndex('songs', [], { name: 'songs_performer_index' });
  pgm.dropIndex('songs', 'album_id');
  pgm.dropIndex('playlists', 'owner');
  pgm.dropIndex('playlist_songs', 'playlist_id');
  pgm.dropIndex('playlist_songs', 'song_id');
  pgm.dropIndex('collaborations', ['playlist_id', 'user_id']);
  pgm.dropIndex('playlist_song_activities', 'playlist_id');
  pgm.dropIndex('users', 'username');
};