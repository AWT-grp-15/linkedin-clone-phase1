function SearchBar() {
  return (
    <div className="search-bar">
      <span className="search-icon">⌕</span>

      <input
        type="search"
        placeholder="Search"
        aria-label="Search"
      />
    </div>
  );
}

export default SearchBar;
