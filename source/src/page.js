import './styles/site.css';

document.querySelectorAll('.system-figure img').forEach((image) => {
  image.addEventListener('click', () => window.open(image.src, '_blank', 'noopener'));
  image.tabIndex = 0;
  image.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') window.open(image.src, '_blank', 'noopener');
  });
});
