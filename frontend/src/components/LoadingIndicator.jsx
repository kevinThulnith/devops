const LoadingIndicator = () => (
  <div className="loader-container">
    <div className="loader-grid">
      {[...Array(16)].map((_, i) => (
        <div key={i} className="block" />
      ))}
    </div>
  </div>
);

export default LoadingIndicator;
