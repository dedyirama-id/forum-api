/* istanbul ignore file */
const pool = require('../src/Infrastructures/database/postgres/pool');

const UserCommentLikesTableTestHelper = {
  async cleanTable() {
    await pool.query('DELETE FROM comments WHERE 1=1');
  },

  async addLike({ id = 'like-123', commentId, userId }) {
    const query = {
      text: 'INSERT INTO user_comment_likes VALUES($1, $2, $3) RETURNING *',
      values: [id, userId, commentId],
    };

    const result = await pool.query(query);
    return result.rows[0];
  },

  async findCommentLikeByCommentId(commentId) {
    const query = {
      text: 'SELECT * FROM user_comment_likes WHERE comment_id = $1',
      values: [commentId],
    };

    const result = await pool.query(query);
    return result.rows;
  },
};

module.exports = UserCommentLikesTableTestHelper;
