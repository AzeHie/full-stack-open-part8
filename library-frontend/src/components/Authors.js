import { Fragment } from 'react';

import './Authors.css';
import UpdateAuthor from './UpdateAuthor';

const Authors = ({ show, authors, setError }) => {
  if (!show) {
    return null;
  }

  if (authors.loading) {
    return <div>Loading...</div>;
  }

  return (
    <Fragment>
      <div>
        <h2>authors</h2>
        <table>
          <tbody>
            <tr>
              <th></th>
              <th>born</th>
              <th>books</th>
            </tr>
            {authors.data.allAuthors.map((a) => (
              <tr key={a.name}>
                <td>{a.name}</td>
                <td>{a.born}</td>
                <td>{a.bookCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <br />
      <UpdateAuthor setError={setError} authors={authors}/>
    </Fragment>
  );
};

export default Authors;
