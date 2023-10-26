const { ApolloServer } = require('@apollo/server');
const { startStandaloneServer } = require('@apollo/server/standalone');
const { v1: uuid } = require('uuid');

const mongoose = require('mongoose');
mongoose.set('strictQuery', false);
const Author = require('./models/AuthorSchema');
const Book = require('./models/BookSchema');
const { GraphQLError } = require('graphql');

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
  }
`;

const resolvers = {
  Query: {
    authorCount: () => Author.collection.countDocuments(),
    bookCount: () => Book.collection.countDocuments(),
    allAuthors: () => Author.find({}),
    allBooks: async (root, args) => {
      let books;

      try {
        if (args.author) {
          books = await Book.find({ author: args.author });
          return books;
        }
        if (args.genre) {
          books = await Book.find({ genres: args.genre });
          return books;
        }

        books = await Book.find({});
        return books;
      } catch (err) {
        throw new GraphQLError('Fetching the books failed!', {
          extensions: {
            code: 'FETCHING FAILED',
            err,
          },
        });
      }
    },
  },
  Mutation: {
    addBook: async (root, args) => {
      const book = new Book({ ...args });
      try {
        await book.save();
      } catch (err) {
        throw new GraphQLError(
          'Adding a new book failed, check your details and try again!',
          {
            extensions: {
              code: 'BAD USER INPUT',
              err,
            },
          }
        );
      }

      return book;
    },
    editAuthor: async (root, args) => {
      try {
        const author = await Author.findOne({ name: args.name });

        if (!author) {
          return null;
        }

        author.born = args.setBornTo;
        await author.save();

        return author;
      } catch (err) {
        throw new GraphQLError(
          'Author edition failed, please check your details and try again!',
          {
            code: 'BAD USER INPUT',
            err,
          }
        );
      }
    },
  },
  Author: {
    bookCount: async (author) => {
      try {
        const bookCount = await Book.countDocuments({ author: author.name });

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
}).then(({ url }) => {
  console.log(`Server ready at ${url}`);
});
