/* eslint-disable camelcase */

exports.up = (pgm) => {
  // Drop foreign key constraint yang terlalu ketat
  pgm.dropConstraint('songs', 'songs_album_id_fkey');
  
  // Tambah foreign key constraint yang lebih flexible (allow null)
  pgm.addConstraint('songs', 'songs_album_id_fkey', {
    foreignKeys: {
      columns: 'album_id',
      references: 'albums(id)',
      onDelete: 'SET NULL'
    }
  });
};

exports.down = (pgm) => {
  pgm.dropConstraint('songs', 'songs_album_id_fkey');
  
  pgm.addConstraint('songs', 'songs_album_id_fkey', {
    foreignKeys: {
      columns: 'album_id',
      references: 'albums(id)',
      onDelete: 'cascade'
    }
  });
};