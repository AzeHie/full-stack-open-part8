const DataLoader = require('dataloader');
const mongoose = require('mongoose');
const Book = require('./models/BookSchema');

const bookCountLoader = new DataLoader(async (authorIds) => {
  const bookCounts = await getBookCounts(authorIds);

  return authorIds.map((authorId) => bookCounts.get(authorId.toString()) || 0); // since bookCounts is key-value pairs, we can "request" value of every key
});

const getBookCounts = async (authorIds) => {
  const bookCountsMap = new Map();

  const bookCounts = await Book.aggregate([
    {
      $match: {
        author: { $in: authorIds },
      },
    },
    {
      $group: { // group the documents by author field (using author id's)
        _id: '$author',
        count: { $sum: 1 }, // increment author's book count always when book by specified author (id) is found.
      },
    },
  ]);

  bookCounts.forEach((result) => { // convert authorId to string, create key-value pairs with MAP
    const authorIdString = result._id.toString();
    bookCountsMap.set(authorIdString, result.count);
  });

  return bookCountsMap; // return key-value pairs
};

module.exports = {
  bookCountLoader,
};