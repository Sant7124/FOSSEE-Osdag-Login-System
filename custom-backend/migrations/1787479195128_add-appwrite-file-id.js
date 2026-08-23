exports.up = (pgm) => {
  pgm.addColumns('files', {
    appwrite_file_id: {
      type: 'varchar(255)',
      unique: true,
      notNull: false, // nullable to support legacy local files during migration
    },
  });

  pgm.createIndex('files', 'appwrite_file_id');
};

exports.down = (pgm) => {
  pgm.dropIndex('files', 'appwrite_file_id');
  pgm.dropColumns('files', ['appwrite_file_id']);
};
