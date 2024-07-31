import { useEffect, useState } from 'react'
import UpdateReview from './UpdateReview'
import { useNavigate } from 'react-router-dom';

export default function Reviews({ bookTitle }) {
  const [reviews, setReviews] = useState([])
  const [selectedReview, setSelectedReview] = useState(null)
  const Navigate = useNavigate()

  const fetchReview = async () => {
    const response = await fetch(`http://localhost:3000/books/reviews/${bookTitle}`);

    if (response.ok) {
      const data = await response.json();
      setReviews(data);
    } else {
      console.error('Could not fetch reviews:', response.statusText);
    }
  };

  useEffect(() => {
    fetchReview();
  }, [bookTitle]);

  const handleUpdateClick = (review) => {
    setSelectedReview(review);
  }

  const DeleteReview = async(Id) => {

    const token = localStorage.getItem('token')

    const response = await fetch(`http://localhost:3000/books/review/delete/${Id}`, {
      method: 'DELETE',
      headers: {'Authorization' : `Bearer ${token}`}
    })

    if(response.ok)
    {

      reviews.filter(review => review._id != Id)
      Navigate('/books')

    }
  }

  return (
    <div>
      <h3>Reviews</h3>
      {reviews.length > 0 ? (
        <ul>
          {reviews.map((review, index) => (
            <div key={index}>
              <li>{review.Review}</li>
              <button onClick={() => handleUpdateClick(review)}>Update</button>
              {selectedReview && selectedReview._id === review._id && (
                <UpdateReview review={review.Review} Id={review._id} />
              )}
              <button onClick={()=>{DeleteReview(review._id)}}>DELETE</button>
            </div>
          ))}
        </ul>
      ) : (
        <p>No reviews yet.</p>
      )}
    </div>
  );
}
