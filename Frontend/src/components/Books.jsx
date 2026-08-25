import { useEffect, useState } from 'react';
import './Books.css';
import { useNavigate } from 'react-router-dom';

export default function Books() {
  const [books, setBooks] = useState([]);
  const [metaData, setMetaData] = useState(null);
  const [authorFilter, setauthorFilter] = useState('');
  const [genreFilter, setgenreFilter] = useState('');
  const [priceFilter, setpriceFilter] = useState(0);
  const Navigate = useNavigate()

  useEffect(()=>{

    const token = localStorage.getItem('token');
    if (!token) {
      Navigate('/logIn');
      return
    }
  },[])

  const fetchData = async () => {

    const filter = [authorFilter, genreFilter, priceFilter];
    const jsonString = encodeURIComponent(JSON.stringify(filter));
    const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:3000/books?filter=${jsonString}`, {
        headers: { 'Authorization': `Bearer ${token}` },})

      if (response.ok) {
        const data = await response.json();
        setBooks(data);
      } else {
        console.error('Failed to fetch books:', response.statusText);
      }

  };

  async function Delete(bookId) {
    const token = localStorage.getItem('token');

    try {
      await fetch(`http://localhost:3000/books/delete/${bookId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      setBooks(books.filter(book => book._id !== bookId));
    } catch (error) {
      console.error('Error deleting book:', error);
    }
  }

  async function handleHover(bookTitle) {
    try {
      const response = await fetch(`https://openlibrary.org/search.json?title=${encodeURIComponent(bookTitle)}`);

      if (response.ok) {
        const data = await response.json();
        if (data.docs && data.docs.length > 0) {
          setMetaData(data.docs[0]);
        }
      } else {
        alert('Could not fetch metadata');
      }
    } catch (error) {
      console.error('Error fetching metadata:', error);
    }
  }

  async function Save(bookId) {
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`http://localhost:3000/books/save/${bookId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        Navigate('/savedBooks');
      } else {
        console.error('Failed to save book:', response.statusText);
      }
    } catch (error) {
      console.error('Error saving book:', error);
    }
  }

  return (
    <div>
      <div className="filter-section">
        <label htmlFor="Author">Author</label>
        <select name="Author" id="Author" onChange={(e) => setauthorFilter(e.target.value)}>
          <option value="">SELECT AUTHOR</option>
          <option value="George Orwell">George Orwell</option>
          <option value="Jane Austen">Jane Austen</option>
          <option value="J.K. Rowling">J.K. Rowling</option>
        </select>

        <label htmlFor="Genre">Genre</label>
        <select name="Genre" id="Genre" onChange={(e) => setgenreFilter(e.target.value)}>
          <option value="">SELECT GENRE</option>
          <option value="Dystopian">Dystopian</option>
          <option value="Fiction">Fiction</option>
          <option value="Fantasy">Fantasy</option>
        </select>

        <label htmlFor="Price">Price</label>
        <select name="Price" id="Price" onChange={(e) => setpriceFilter(e.target.value)}>
          <option value="">SELECT PRICE</option>
          <option value="650">less than 650</option>
          <option value="800">less than 800</option>
          <option value="1000">less than 1000</option>
        </select>

        <button onClick={fetchData}>Submit</button>
      </div>

      {books.length > 0 && (
        <div className='BooksBody'>
          <a href="http://localhost:5173/createBook">Create your own book</a>
          {books.map((book) => (
            <div className='Book' key={book._id}>
              <div className='book-image'>
                <img
                  onMouseEnter={() => handleHover(book.Title)}
                  src={`data:${book.contentType};base64,${btoa(
                    String.fromCharCode(...new Uint8Array(book.data.data))
                  )}`}
                />
              </div>
              <div className='book-info'>
                <h3>Title: {book.Title}</h3>
                <h3>Author: {book.Author}</h3>
                <h3>Genre: {book.Genre}</h3>
                <p>Description: {book.Description}</p>
                <button onClick={() => Delete(book._id)}>DELETE</button>
                <button onClick={() => Save(book._id)}>ADD TO FAVOURITES</button>
                {metaData && (
                  <div className="metadata">
                    <p><strong>ISBN:</strong> {metaData.isbn[0] || 'N/A'}</p>
                    <p><strong>Published:</strong> {metaData.first_publish_year || 'N/A'}</p>
                    <p><strong>Pages:</strong> {metaData.number_of_pages_median || 'N/A'}</p>
                    <p><strong>Publisher:</strong> {metaData.publisher?.[0] || 'N/A'}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
