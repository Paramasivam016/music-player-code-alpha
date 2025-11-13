// dynamic playlist with add/delete/set/trending
let songs = [
  { title: "Shape of You", artist: "Ed Sheeran", src: "music/song1.mp3", cover: "images/song1.jpg", trending: true },
  { title: "Levitating", artist: "Dua Lipa", src: "music/song2.mp3", cover: "images/song2.jpg", trending: false },
  { title: "Blinding Lights", artist: "The Weeknd", src: "music/song3.mp3", cover: "images/song3.jpg", trending: false },
];

// restore from localStorage if available
try {
  const saved = localStorage.getItem('mp_songs');
  if (saved) songs = JSON.parse(saved);
} catch (err) { console.warn('Could not parse saved songs', err); }

let songIndex = 0;

const audio = document.getElementById("audio");
const playBtn = document.getElementById("play");
const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");
const title = document.getElementById("title");
const artist = document.getElementById("artist");
const cover = document.getElementById("cover");
const progressContainer = document.getElementById("progress-container");
const progress = document.getElementById("progress");
const currentTimeEl = document.getElementById("current-time");
const durationEl = document.getElementById("duration");
const volume = document.getElementById("volume");
const playlistEl = document.getElementById('playlist');
const addForm = document.getElementById('add-song-form');

function saveSongs() { localStorage.setItem('mp_songs', JSON.stringify(songs)); }

function renderPlaylist() {
  playlistEl.innerHTML = '';
  songs.forEach((s, i) => {
    const li = document.createElement('li');
    li.dataset.index = i;
    if (i === songIndex) li.classList.add('active');

    const left = document.createElement('div'); left.className = 'item-left';
    const tt = document.createElement('span'); tt.className = 'track-title'; tt.textContent = s.title;
    const art = document.createElement('small'); art.style.opacity = '0.8'; art.textContent = ' - ' + s.artist;
    left.appendChild(tt); left.appendChild(art);

    const right = document.createElement('div'); right.className = 'item-right';
    const setBtn = document.createElement('button'); setBtn.className = 'btn small set'; setBtn.textContent = 'Set'; setBtn.title = 'Play this song';
    const trendBtn = document.createElement('button'); trendBtn.className = 'btn small trending' + (s.trending ? ' on' : ''); trendBtn.textContent = s.trending ? '★' : '☆';
    const delBtn = document.createElement('button'); delBtn.className = 'btn small delete'; delBtn.textContent = '✕'; delBtn.title = 'Delete this song';
    right.appendChild(setBtn); right.appendChild(trendBtn); right.appendChild(delBtn);

    li.appendChild(left); li.appendChild(right);
    playlistEl.appendChild(li);
  });
}

function loadSong(song) {
  title.textContent = song.title;
  artist.textContent = song.artist;
  audio.src = song.src;
  cover.src = song.cover || 'images/placeholder.jpg';
  renderPlaylist();
}

function playSong() {
  document.querySelector('.album-art').classList.add('playing');
  playBtn.innerHTML = '<i class="fa fa-pause"></i>';
  audio.play().catch(e => console.warn('Play prevented', e));
}

function pauseSong() {
  document.querySelector('.album-art').classList.remove('playing');
  playBtn.innerHTML = '<i class="fa fa-play"></i>';
  audio.pause();
}

playBtn.addEventListener('click', () => {
  const isPlaying = document.querySelector('.album-art').classList.contains('playing');
  if (isPlaying) pauseSong(); else playSong();
});

nextBtn.addEventListener('click', nextSong);
prevBtn.addEventListener('click', prevSong);

function nextSong() {
  songIndex = (songIndex + 1) % songs.length;
  loadSong(songs[songIndex]);
  playSong();
}

function prevSong() {
  songIndex = (songIndex - 1 + songs.length) % songs.length;
  loadSong(songs[songIndex]);
  playSong();
}

audio.addEventListener('timeupdate', updateProgress);
progressContainer.addEventListener('click', setProgress);
audio.addEventListener('ended', nextSong);
volume.addEventListener('input', () => (audio.volume = volume.value));

function updateProgress(e) {
  const { duration, currentTime } = e.srcElement;
  const progressPercent = (currentTime / duration) * 100 || 0;
  progress.style.width = `${progressPercent}%`;

  let currentMinutes = Math.floor(currentTime / 60) || 0;
  let currentSeconds = Math.floor(currentTime % 60) || 0;
  if (currentSeconds < 10) currentSeconds = '0' + currentSeconds;
  currentTimeEl.textContent = `${currentMinutes}:${currentSeconds}`;

  if (duration) {
    let durationMinutes = Math.floor(duration / 60) || 0;
    let durationSeconds = Math.floor(duration % 60) || 0;
    if (durationSeconds < 10) durationSeconds = '0' + durationSeconds;
    durationEl.textContent = `${durationMinutes}:${durationSeconds}`;
  }
}

function setProgress(e) {
  const width = this.clientWidth;
  const clickX = e.offsetX;
  const duration = audio.duration;
  audio.currentTime = (clickX / width) * duration;
}

// handle clicks using event delegation
playlistEl.addEventListener('click', (e) => {
  const li = e.target.closest('li');
  if (!li) return;
  const idx = parseInt(li.dataset.index, 10);

  if (e.target.closest('.delete')) {
    // delete
    songs.splice(idx, 1);
    if (songIndex === idx) songIndex = 0;
    else if (songIndex > idx) songIndex--;
    saveSongs();
    if (songs.length) loadSong(songs[songIndex]); else {
      // nothing left
      title.textContent = '';
      artist.textContent = '';
      audio.src = '';
      renderPlaylist();
    }
    return;
  }

  if (e.target.closest('.set')) {
    songIndex = idx; loadSong(songs[songIndex]); playSong(); return;
  }

  if (e.target.closest('.trending')) {
    songs[idx].trending = !songs[idx].trending;
    saveSongs(); renderPlaylist(); return;
  }

  // default: click on item plays it
  songIndex = idx; loadSong(songs[songIndex]); playSong();
});

addForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const t = document.getElementById('add-title').value.trim();
  const a = document.getElementById('add-artist').value.trim();
  const s = document.getElementById('add-src').value.trim();
  const c = document.getElementById('add-cover').value.trim();
  if (!t || !a || !s) return;
  songs.push({ title: t, artist: a, src: s, cover: c || 'images/placeholder.jpg', trending: false });
  saveSongs();
  document.getElementById('add-title').value = '';
  document.getElementById('add-artist').value = '';
  document.getElementById('add-src').value = '';
  document.getElementById('add-cover').value = '';
  renderPlaylist();
});

document.addEventListener('keydown', e => {
  if (e.code === 'Space') { e.preventDefault(); playBtn.click(); }
  if (e.code === 'ArrowRight') nextSong();
  if (e.code === 'ArrowLeft') prevSong();
});

// initial render/load
if (songs.length) loadSong(songs[songIndex]); else renderPlaylist();