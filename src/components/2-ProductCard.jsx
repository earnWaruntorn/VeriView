const truncate = (text, maxLength = 35) => {
  if (!text) return "";
  const str = String(text);
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + "...";
};

const ProductCard = ({ data }) => {
  const priceStr = `${data.price?.toLocaleString() || 0} THB`;

  return (
    <div className="product-card">
      <img src={data.image} alt={truncate(data.name)} />

      <div className="product-info">
        <p className="label">
          <strong>Product:</strong> {truncate(data.name)}
        </p>
        <p>
          <strong>Store:</strong> {truncate(data.store)}
        </p>
        <p>
          <strong>Price:</strong> {truncate(priceStr)}
        </p>
      </div>
    </div>
  );
};

export default ProductCard;