const CommentsTableTestHelper = require('../../../../tests/CommentsTableTestHelper');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const UserCommentLikesTableTestHelper = require('../../../../tests/UserCommentLikesTableTestHelper');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const AuthorizationError = require('../../../Commons/exceptions/AuthorizationError');
const NotFoundError = require('../../../Commons/exceptions/NotFoundError');
const AddedComment = require('../../../Domains/comments/entities/AddedComment');
const Comment = require('../../../Domains/comments/entities/Comment');
const NewComment = require('../../../Domains/comments/entities/NewComment');
const pool = require('../../database/postgres/pool');
const CommentRepositoryPostgres = require('../CommentRepositoryPostgres');

describe('CommentRepositoryPostgres', () => {
  beforeAll(async () => {
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
    await UserCommentLikesTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
  });

  afterEach(async () => {
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
    await UserCommentLikesTableTestHelper.cleanTable();
  });

  describe('addComment function', () => {
    it('should persist new comment correctly', async () => {
      // Arrange
      const newComment = new NewComment({
        content: 'lorem ipsum',
        owner: 'user-123',
        threadId: 'thread-123',
      });

      const fakeIdGenerator = () => '123';
      const commentRepository = new CommentRepositoryPostgres(pool, fakeIdGenerator);
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });

      // Action
      await commentRepository.addComment('thread-123', 'user-123', newComment);

      // Assert
      const addedComment = await CommentsTableTestHelper.findCommentsById('comment-123');
      expect(addedComment).toHaveLength(1);
    });

    it('should return added comment correctly', async () => {
      // Arrange
      const newComment = new NewComment({
        content: 'lorem ipsum',
        owner: 'user-123',
        threadId: 'thread-123',
      });

      const fakeIdGenerator = () => '123';
      const commentRepository = new CommentRepositoryPostgres(pool, fakeIdGenerator);
      await UsersTableTestHelper.addUser({ id: 'user-123', username: 'dicoding' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });

      // Action
      const addedComment = await commentRepository.addComment('thread-123', 'user-123', newComment);

      // Assert
      expect(addedComment).toStrictEqual(new AddedComment({
        id: 'comment-123',
        content: 'lorem ipsum',
        user_id: 'user-123',
        is_delete: false,
      }));
    });

    it('should store comment to database correctly', async () => {
      // Arrange
      const newComment = new NewComment({
        content: 'lorem ipsum',
        owner: 'user-123',
        threadId: 'thread-123',
      });

      const fakeIdGenerator = () => '123';
      const commentRepository = new CommentRepositoryPostgres(pool, fakeIdGenerator);
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });

      // Action
      await commentRepository.addComment('thread-123', 'user-123', newComment);

      // Assert
      const addedComment = await CommentsTableTestHelper.findCommentsById('comment-123');
      expect(addedComment).toHaveLength(1);
      expect(addedComment[0].content).toEqual('lorem ipsum');
      expect(addedComment[0].user_id).toEqual('user-123');
      expect(addedComment[0].thread_id).toEqual('thread-123');
    });
  });

  describe('deleteCommentById function', () => {
    it('should delete comment correctly', async () => {
      // Arrange
      const newComment = new NewComment({
        content: 'lorem ipsum',
        owner: 'user-123',
        threadId: 'thread-123',
      });

      const fakeIdGenerator = () => '123';
      const commentRepository = new CommentRepositoryPostgres(pool, fakeIdGenerator);

      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123' });

      await commentRepository.addComment('thread-123', 'user-123', newComment);

      // Action
      await commentRepository.deleteCommentById('comment-123');

      // Assert
      const comment = await CommentsTableTestHelper.findCommentsById('comment-123');
      expect(comment).toHaveLength(1);
      expect(comment[0].is_delete).toBe(true);
    });
  });

  describe('getCommentById function', () => {
    it('should return comment correctly', async () => {
      // Arrange
      const newComment = new NewComment({
        content: 'lorem ipsum',
        owner: 'user-123',
        threadId: 'thread-123',
      });

      const fakeIdGenerator = () => '123';
      const commentRepository = new CommentRepositoryPostgres(pool, fakeIdGenerator);

      await UsersTableTestHelper.addUser({ id: 'user-123', username: 'dicoding' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123' });

      await commentRepository.addComment('thread-123', 'user-123', newComment);

      // Action
      const comment = await commentRepository.getCommentById('comment-123');

      // Assert
      expect(comment).toStrictEqual(new Comment({
        id: 'comment-123',
        content: 'lorem ipsum',
        user_id: 'user-123',
        thread_id: 'thread-123',
        parent_comment_id: null,
        created_at: comment.createdAt,
        updated_at: comment.updatedAt,
        is_delete: false,
        username: 'dicoding',
        like_count: 0,
      }));
      expect(comment.createdAt).toBeInstanceOf(Date);
      expect(comment.updatedAt).toBeInstanceOf(Date);
    });

    it('should return deleted comment properly', async () => {
      // Arrange
      const newComment = new NewComment({
        content: 'lorem ipsum',
        owner: 'user-123',
        threadId: 'thread-123',
      });

      const fakeIdGenerator = () => '123';
      const commentRepository = new CommentRepositoryPostgres(pool, fakeIdGenerator);

      await UsersTableTestHelper.addUser({ id: 'user-123', username: 'dicoding' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123' });

      await commentRepository.addComment('thread-123', 'user-123', newComment);
      await commentRepository.deleteCommentById('comment-123');

      // Action
      const comment = await commentRepository.getCommentById('comment-123');

      // Assert
      expect(comment).toStrictEqual(new Comment({
        id: 'comment-123',
        content: 'lorem ipsum',
        user_id: 'user-123',
        thread_id: 'thread-123',
        parent_comment_id: null,
        created_at: comment.createdAt,
        updated_at: comment.updatedAt,
        is_delete: true,
        username: 'dicoding',
        like_count: 0,
      }));
      expect(comment.createdAt).toBeInstanceOf(Date);
      expect(comment.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('getAllCommentsByThreadId function', () => {
    it('should return all comments by thread id correctly', async () => {
      // Arrange
      const fakeIdGenerator = () => '123';
      const commentRepository = new CommentRepositoryPostgres(pool, fakeIdGenerator);

      await UsersTableTestHelper.addUser({ id: 'user-123', username: 'userA' });
      await UsersTableTestHelper.addUser({ id: 'user-456', username: 'userB' });
      await UsersTableTestHelper.addUser({ id: 'user-789', username: 'userC' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });

      await CommentsTableTestHelper.addComment({
        id: 'comment-123', content: 'comment 1', threadId: 'thread-123', userId: 'user-123', isDelete: false,
      });
      await CommentsTableTestHelper.addComment({
        id: 'comment-456', content: 'reply to comment 1', threadId: 'thread-123', userId: 'user-456', parentCommentId: 'comment-123', isDelete: false,
      });
      await CommentsTableTestHelper.addComment({
        id: 'comment-789', content: 'another reply to comment 1', threadId: 'thread-123', userId: 'user-789', parentCommentId: 'comment-123', isDelete: false,
      });

      // Action
      const comments = await commentRepository.getAllCommentsByThreadId('thread-123');

      // Assert
      expect(comments).toHaveLength(3);
      expect(comments[0]).toStrictEqual(new Comment({
        id: 'comment-123',
        content: 'comment 1',
        user_id: 'user-123',
        thread_id: 'thread-123',
        parent_comment_id: null,
        created_at: comments[0].createdAt,
        updated_at: comments[0].updatedAt,
        is_delete: false,
        username: 'userA',
        like_count: 0,
      }));
      expect(comments[0].createdAt).toBeInstanceOf(Date);
      expect(comments[0].updatedAt).toBeInstanceOf(Date);

      expect(comments[1]).toStrictEqual(new Comment({
        id: 'comment-456',
        content: 'reply to comment 1',
        user_id: 'user-456',
        thread_id: 'thread-123',
        parent_comment_id: 'comment-123',
        created_at: comments[1].createdAt,
        updated_at: comments[1].updatedAt,
        is_delete: false,
        username: 'userB',
        like_count: 0,
      }));
      expect(comments[1].createdAt).toBeInstanceOf(Date);
      expect(comments[1].updatedAt).toBeInstanceOf(Date);

      expect(comments[2]).toStrictEqual(new Comment({
        id: 'comment-789',
        content: 'another reply to comment 1',
        user_id: 'user-789',
        thread_id: 'thread-123',
        parent_comment_id: 'comment-123',
        created_at: comments[2].createdAt,
        updated_at: comments[2].updatedAt,
        is_delete: false,
        username: 'userC',
        like_count: 0,
      }));
      expect(comments[2].createdAt).toBeInstanceOf(Date);
      expect(comments[2].updatedAt).toBeInstanceOf(Date);
    });

    it('should return an empty array when there are no comments for the thread id', async () => {
      // Arrange
      const fakeIdGenerator = () => '123';
      const commentRepository = new CommentRepositoryPostgres(pool, fakeIdGenerator);

      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });

      // Action
      const comments = await commentRepository.getAllCommentsByThreadId('thread-123');

      // Assert
      expect(comments).toHaveLength(0);
    });
  });

  describe('verifyCommentOwner function', () => {
    it('should throw AuthorizationError when user is not the owner', async () => {
      // Arrange
      const fakeIdGenerator = () => '123';
      const commentRepository = new CommentRepositoryPostgres(pool, fakeIdGenerator);

      await UsersTableTestHelper.addUser({ id: 'user-123', username: 'userA' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });

      await CommentsTableTestHelper.addComment({
        id: 'comment-123', content: 'comment 1', threadId: 'thread-123', userId: 'user-123', isDelete: false,
      });

      // Action & Assert
      await expect(commentRepository.verifyCommentOwner('comment-123', 'user-xxx')).rejects.toThrowError(AuthorizationError);
    });

    it('should not throw error when user is the owner', async () => {
      // Arrange
      const fakeIdGenerator = () => '123';
      const commentRepository = new CommentRepositoryPostgres(pool, fakeIdGenerator);

      await UsersTableTestHelper.addUser({ id: 'user-123', username: 'userA' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });

      await CommentsTableTestHelper.addComment({
        id: 'comment-123', content: 'comment 1', threadId: 'thread-123', userId: 'user-123', isDelete: false,
      });

      // Action & Assert
      await expect(commentRepository.verifyCommentOwner('comment-123', 'user-123')).resolves.not.toThrowError(AuthorizationError);
    });
  });

  describe('verifyCommentAvailability function', () => {
    it('should throw NotFoundError when comment is not found', async () => {
      // Arrange
      const fakeIdGenerator = () => '123';
      const commentRepository = new CommentRepositoryPostgres(pool, fakeIdGenerator);

      await UsersTableTestHelper.addUser({ id: 'user-123', username: 'userA' });

      // Action & Assert
      await expect(commentRepository.verifyCommentAvailability('comment-123')).rejects.toThrowError(NotFoundError);
    });

    it('should not throw error when comment is available', async () => {
      // Arrange
      const fakeIdGenerator = () => '123';
      const commentRepository = new CommentRepositoryPostgres(pool, fakeIdGenerator);

      await UsersTableTestHelper.addUser({ id: 'user-123', username: 'userA' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });

      await CommentsTableTestHelper.addComment({
        id: 'comment-123', content: 'comment 1', threadId: 'thread-123', userId: 'user-123', isDelete: false,
      });

      // Action & Assert
      await expect(commentRepository.verifyCommentAvailability('comment-123')).resolves.not.toThrowError(NotFoundError);
    });
  });

  describe('verifyIsCommentLiked function', () => {
    it('should return false when user has not been liked the comment', async () => {
      // Arrange
      const fakeIdGenerator = () => '123';
      const commentRepository = new CommentRepositoryPostgres(pool, fakeIdGenerator);

      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123' });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123' });

      // Action & Assert
      await expect(commentRepository.verifyIsCommentLiked('comment-123', 'user-123')).resolves.toBe(false);
    });

    it('should return true when user has been liked the comment', async () => {
      // Arrange
      const fakeIdGenerator = () => '123';
      const commentRepository = new CommentRepositoryPostgres(pool, fakeIdGenerator);

      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123' });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123' });
      await UserCommentLikesTableTestHelper.addLike({ userId: 'user-123', commentId: 'comment-123' });

      // Action & Assert
      await expect(commentRepository.verifyIsCommentLiked('comment-123', 'user-123')).resolves.toBe(true);
    });
  });

  describe('addCommentLikeById function', () => {
    it('should persist new like record correctly', async () => {
      // Arrange
      const fakeIdGenerator = () => '123';
      const commentRepository = new CommentRepositoryPostgres(pool, fakeIdGenerator);

      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123', userId: 'user-123' });

      // Action
      await commentRepository.addCommentLikeById('comment-123', 'user-123');

      // Assert
      const addedLike = await UserCommentLikesTableTestHelper.findCommentLikeByCommentId('comment-123');
      expect(addedLike).toHaveLength(1);
      expect(addedLike[0]).toStrictEqual({
        id: 'like-123',
        user_id: 'user-123',
        comment_id: 'comment-123',
      });
    });

    it('should throw error when userId is invalid', async () => {
      // Arrange
      const fakeIdGenerator = () => '123';
      const commentRepository = new CommentRepositoryPostgres(pool, fakeIdGenerator);

      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123', userId: 'user-123' });

      // Action & Assert
      await expect(commentRepository.addCommentLikeById('comment-123', 'user-456')).rejects.toThrowError();
    });

    it('should throw error when commentId is invalid', async () => {
      // Arrange
      const fakeIdGenerator = () => '123';
      const commentRepository = new CommentRepositoryPostgres(pool, fakeIdGenerator);

      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123', userId: 'user-123' });

      // Action & Assert
      await expect(commentRepository.addCommentLikeById('comment-456', 'user-123')).rejects.toThrowError();
    });
  });

  describe('deleteCommentLikeById function', () => {
    it('should delete like record correctly', async () => {
      // Arrange
      const fakeIdGenerator = () => '123';
      const commentRepository = new CommentRepositoryPostgres(pool, fakeIdGenerator);

      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123', userId: 'user-123' });
      await UserCommentLikesTableTestHelper.addLike({ commentId: 'comment-123', userId: 'user-123' });

      const beforeDelete = await UserCommentLikesTableTestHelper.findCommentLikeByCommentId('comment-123');

      // Action
      await commentRepository.deleteCommentLikeById('comment-123', 'user-123');

      // Assert
      expect(beforeDelete).toHaveLength(1);
      const afterDelete = await UserCommentLikesTableTestHelper.findCommentLikeByCommentId('comment-123');
      expect(afterDelete).toHaveLength(0);
    });

    it('should throw NotFoundError when like record is not found', async () => {
      // Arrange
      const fakeIdGenerator = () => '123';
      const commentRepository = new CommentRepositoryPostgres(pool, fakeIdGenerator);

      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123' });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123' });

      // Action & Assert
      await expect(commentRepository.deleteCommentLikeById('comment-123', 'user-123')).rejects.toThrowError(NotFoundError);
    });
  });
});
