const ProductCard = ({ data }) => {
  return (
    <div className="product-card">
      <img src={data.image} alt={data.name} />

      <div className="product-info">
        <p className="label">
          <strong>Product:</strong> {data.name}
        </p>
        <p>
          <strong>Store:</strong> {data.store}
        </p>
        <p>
          <strong>Price:</strong> {data.price.toLocaleString()} THB
        </p>
      </div>
    </div>
  );
};

export default ProductCard;