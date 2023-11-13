const { ApolloServer } = require('@apollo/server');
const { startStandaloneServer } = require('@apollo/server/standalone');
const { v1: uuid } = require('uuid');

const mongoose = require('mongoose');
mongoose.set('strictQuery', false);

const { GraphQLError } = require('graphql');

const Author = require('./models/AuthorSchema');
const Book = require('./models/BookSchema');
const User = require('./models/UserSchema');

const jwt = require('jsonwebtoken');

require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

console.log('Connecting to MongoDB');

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to database');
  })
  .catch((err) => {
    console.log('Error connecting to MongoDB', err.message);
  });

const typeDefs = `
  type User {
    username: String!
    favoriteGenre: String!
    id: ID!
  }

  type Token {
    value: String!
    favoriteGenre: String!
  }

  type Author {
    name: String!
    born: Int
    id: ID!
    bookCount: Int!
  }

  type Book {
    title: String!
    published: Int!
    author: String!
    id: ID!
    genres: [String!]!
  }

  type Query {
    authorCount: Int!
    bookCount: Int!
    allAuthors: [Author!]!
    allBooks(author: String, genre: String): [Book!]!
    me: User
  }

  type Mutation {
    addBook(
      title: String!
      author: String!
      published: Int!
      genres: [String!]!
    ): Book

    editAuthor(
      name: String!
      setBornTo: Int!
    ): Author

    createUser(
      username: String!
      favoriteGenre: String!
    ) : User

    login(
      username: String!
      password: String!
    ) : Token
  }
`;

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

      if (!currentUser) {
        throw new GraphQLError('not authenticated', {
          extensions: {
            code: 'BAD_USER_INPUT',
          },
        });
      }

      try {
        const author = await Author.findOne({ name: currentUser.username });

        const book = new Book({ ...args, author: author._id });

        if (!author) {
          return null;
        }

        await book.save();

        return book;
      } catch (err) {
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
        const bookCount = await Book.countDocuments({ author: author._id });

        return bookCount;
      } catch (err) {
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
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

startStandaloneServer(server, {
  listen: { port: 4000 },
  context: async ({ req, res }) => {
    const auth = req ? req.headers.authorization : null;

    if (auth && auth.startsWith('Bearer ')) {
      const decodedToken = jwt.verify(
        auth.substring(7),
        process.env.JWT_SECRET
      );

      const currentUser = await User.findById(decodedToken.id);

      return { currentUser };
    }
  },
}).then(({ url }) => {
  console.log(`Server ready at ${url}`);
});
