import "../NewsLetter/NewsLetter.css";

export default function NewsLetter() {
  return (
    <div className="newsletter">
      <h1>Get Exclusive Offers On Your Email</h1>
      <p>Subscribe to our newsletter and star updated</p>
      <div>
        <input type="email" placeholder="Your email id" />
        <button>Subscribe</button>
      </div>
    </div>
  );
}