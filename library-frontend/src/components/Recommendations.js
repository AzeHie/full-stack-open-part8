const Recommendations = ({ books, show, user }) => {
  if (books.loading) {
    return <p>Loading..</p>;
  }

  if (!books || !books.data || !books.data.allBooks) {
    return <p>Data not found</p>;
  }

  if (!show) {
    return null;
  }

  const booksByFavoriteGenre = books.data.allBooks.filter((b) => b.genres.includes(user.favoriteGenre));

  return (
    <div>
            <table>
        <tbody>
          <tr>
            <th></th>
            <th>author</th>
            <th>published</th>
          </tr>
          {booksByFavoriteGenre.map((b) => (
            <tr key={b.title}>
              <td>{b.title}</td>
              <td>{b.author}</td>
              <td>{b.published}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default Recommendations;