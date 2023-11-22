const { GraphQLError } = require('graphql');

const { PubSub } = require('graphql-subscriptions');
const pubsub = new PubSub();

const Author = require('../models/AuthorSchema');
const Book = require('../models/BookSchema');
const User = require('../models/UserSchema');

const { bookCountLoader } = require('../DataLoaders');

const jwt = require('jsonwebtoken');

const resolvers = {
  Query: {
    me: (root, args, context) => {
      return context.currentUser;
    },
    authorCount: async () => await Author.collection.countDocuments(),
    bookCount: async () => await Book.collection.countDocuments(),
    allAuthors: async () => await Author.find({}),
    allBooks: async (root, args) => {
      let books;

      try {
        if (args.author) {
          const author = await Author.findOne({ name: args.author });

          books = await Book.find({ author: args.author });

          return books.map((book) => ({
            id: book.id,
            title: book.title,
            published: book.published,
            author: author.name,
            genres: book.genres,
          }));
        }
        if (args.genre) {
          books = await Book.find({ genres: args.genre });

          books = await Promise.all(
            books.map(async (book) => {
              const author = await Author.findById(book.author);
              return {
                id: book.id,
                title: book.title,
                published: book.published,
                author: author.name,
                genres: book.genres,
              };
            })
          );

          return books;
        }

        books = await Book.find({});

        books = await Promise.all(
          // to make couple (or more) operations concurrently, in this case we wait result of author-query before continuing.
          books.map(async (book) => {
            const author = await Author.findById(book.author);
            return {
              id: book.id,
              title: book.title,
              published: book.published,
              author: author.name,
              genres: book.genres,
            };
          })
        );

        return books;
      } catch (err) {
        throw new GraphQLError('Fetching the books failed!', {
          extensions: {
            code: 'FETCHING_FAILED',
            err,
          },
        });
      }
    },
  },

  Mutation: {
    addBook: async (root, args, context) => {
      const currentUser = context.currentUser;
      let book;

      if (!currentUser) {
        throw new GraphQLError('not authenticated', {
          extensions: {
            code: 'BAD_USER_INPUT',
          },
        });
      }

      try {
        const author = await Author.findOne({ name: currentUser.username });
        let newAuthorData;

        if (!author) {
          const newAuthor = new Author({
            name: args.author,
            year: 0,
          });

          newAuthorData = await newAuthor.save();
        }

        book = new Book({
          ...args,
          author: newAuthorData ? newAuthorData._id : author._id,
        });

        await book.save();

      } catch (err) {
        console.log(err);
        throw new GraphQLError(
          'Adding a new book failed, check your details and try again!',
          {
            extensions: {
              code: 'BAD_USER_INPUT',
              err,
            },
          }
        );
      }

      pubsub.publish('BOOK_ADDED', { bookAdded: book });

      return book;
    },
    editAuthor: async (root, args, context) => {
      const currentUser = context.currentUser;

      if (!currentUser) {
        throw new GraphQLError('Not authenticated', {
          extensions: {
            code: 'BAD_USER_INPUT',
          },
        });
      }

      try {
        const author = await Author.findOne({ name: args.name });

        if (!author) {
          return null;
        }

        author.born = args.setBornTo;
        await author.save();

        return author;
      } catch (err) {
        console.log(err);
        throw new GraphQLError(
          'Author edition failed, please check your details and try again!',
          {
            extensions: {
              code: 'BAD_USER_INPUT',
              err,
            },
          }
        );
      }
    },
    createUser: async (root, args) => {
      const user = new User({
        username: args.username,
        favoriteGenre: args.favoriteGenre,
      });

      try {
        await user.save();
        return user;
      } catch (err) {
        throw new GraphQLError(
          'Creating new user failed, check your details and try again',
          {
            extensions: {
              code: 'BAD_USER_INPUT',
              err,
            },
          }
        );
      }
    },
    login: async (root, args) => {
      try {
        const user = await User.findOne({ username: args.username });

        if (!user || args.password !== 'salasana') {
          throw new GraphQLError('Invalid credentials', {
            extensions: {
              code: 'BAD_USER_INPUT',
            },
          });
        }

        const userForToken = {
          username: args.username,
          id: user._id,
        };

        const token = jwt.sign(userForToken, process.env.JWT_SECRET);

        return { value: token, favoriteGenre: user.favoriteGenre };
      } catch (err) {
        console.log(err);
        throw new GraphQLError('Logging in failed', {
          extensions: {
            code: 'BAD_USER_INPUT',
            err,
          },
        });
      }
    },
  },
  Author: {
    bookCount: async (author) => {
      try {
        const bookCount = await bookCountLoader.load(author._id);

        return bookCount;
      } catch (err) {
        console.log(err);
        throw new GraphQLError(
          'Book count is not available, please try again!',
          {
            code: 'SOMETHING WENT WRONG',
            err,
          }
        );
      }
    },
  },
  Subscription: {
    bookAdded: {
      subscribe: () => pubsub.asyncIterator('BOOK_ADDED')
    }
  }
};

module.exports = resolvers;