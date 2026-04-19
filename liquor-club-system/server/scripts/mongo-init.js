db.createUser({
  user: 'liquorclub',
  pwd: 'liquorclub123',
  roles: [
    {
      role: 'readWrite',
      db: 'liquor_club_db',
    },
  ],
});
