import { getActiveTabURL } from "./utils.js";

const addNewBookmark = (bookmarks, bookmark) => {
  const bookmarkTitleElement = document.createElement("div");
  const controlsElement = document.createElement("div");
  const newBookmarkElement = document.createElement("div");

  bookmarkTitleElement.textContent = bookmark.desc;
  bookmarkTitleElement.className = "bookmark-title";
  controlsElement.className = "bookmark-controls";

  setBookmarkAttributes("play", onPlay, controlsElement);
  setBookmarkAttributes("delete", onDelete, controlsElement);
  // setBookmarkAttributes("save", onPenClick, controlsElement);


  let bookmark_id = "bookmark-" + bookmark.time;
  newBookmarkElement.id = bookmark_id;
  newBookmarkElement.className = "bookmark";
  newBookmarkElement.setAttribute("timestamp", bookmark.time);

  newBookmarkElement.appendChild(bookmarkTitleElement);
  newBookmarkElement.appendChild(controlsElement);
  bookmarks.appendChild(newBookmarkElement);

  const noteTextArea = document.createElement("textarea");
  noteTextArea.id = "note-text-area-" + bookmark.time;
  noteTextArea.placeholder = "Write your notes here";
  noteTextArea.style.width = "200px";
  noteTextArea.style.height = "100px";
  noteTextArea.value = localStorage.getItem(bookmark_id)

  noteTextArea.addEventListener("change", (event) => {
    // console.log(event.target.value)
    localStorage.setItem(bookmark_id, event.target.value);
  })


  newBookmarkElement.insertAdjacentElement('afterend', noteTextArea);
};



const viewBookmarks = (currentBookmarks = []) => {
  const bookmarksElement = document.getElementById("bookmarks");
  bookmarksElement.innerHTML = "";

  if (currentBookmarks.length > 0) {
    for (let i = 0; i < currentBookmarks.length; i++) {
      const bookmark = currentBookmarks[i];
      addNewBookmark(bookmarksElement, bookmark);
    }
  } else {
    bookmarksElement.innerHTML = '<i class="row">No bookmarks to show</i>';
  }

  return;
};

const onPlay = async e => {
  const bookmarkTime = e.target.parentNode.parentNode.getAttribute("timestamp");
  const activeTab = await getActiveTabURL();

  chrome.tabs.sendMessage(activeTab.id, {
    type: "PLAY",
    value: bookmarkTime,
  });
};

const onDelete = async e => {
  const activeTab = await getActiveTabURL();
  const bookmarkTime = e.target.parentNode.parentNode.getAttribute("timestamp");
  const element_id = "bookmark-" + bookmarkTime;
  const bookmarkElementToDelete = document.getElementById(
    element_id
  );

  bookmarkElementToDelete.parentNode.removeChild(bookmarkElementToDelete);

  chrome.tabs.sendMessage(activeTab.id, {
    type: "DELETE",
    value: bookmarkTime,
  }, viewBookmarks);
};


const onPenClick = async e => {
  console.log("onPenClick called");
  const activeTab = await getActiveTabURL();

  chrome.tabs.sendMessage(activeTab.id, {
    type: "OPEN_NOTE",
  });

  const bookmarkTime = e.target.parentNode.parentNode.getAttribute("timestamp");
  console.log("bookmarkTime:", bookmarkTime);

  // let noteTextArea = document.getElementById("note-text-area-" + bookmarkTime);
  // let saveButton = document.getElementById("save-button-" + bookmarkTime);

  // if (!noteTextArea) {
  console.log("creating noteTextArea");
  const noteTextArea = document.createElement("textarea");
  noteTextArea.id = "note-text-area-" + bookmarkTime;
  noteTextArea.placeholder = "Write your notes here";
  noteTextArea.style.width = "200px";
  noteTextArea.style.height = "100px";
  document.body.appendChild(noteTextArea);
  // }

  // if (!saveButton) {
  //   console.log("creating saveButton");
  //   saveButton = document.createElement("button");
  //   saveButton.id = "save-button-" + bookmarkTime;
  //   saveButton.textContent = "Save";
  //   saveButton.style.marginTop = "10px";
  //   document.body.appendChild(saveButton);

    e.addEventListener("click", async () => {
      const currentTab = await getActiveTabURL();
      const currentTabUrl = currentTab.url;
      const currentNote = noteTextArea.value;

      // Save the current note for the current tab
    chrome.storage.local.set({ [currentTabUrl + "-" + bookmarkTime]: currentNote }, () => {
      // saveButton.textContent = "Saved!";
      // saveButton.disabled = true;
    });
  });
  // }

  // Load the saved note for the current tab and bookmark
  const currentTab = await getActiveTabURL();
  const currentTabUrl = currentTab.url;
  chrome.storage.local.get(currentTabUrl + "-" + bookmarkTime, ({ [currentTabUrl + "-" + bookmarkTime]: savedNote }) => {
    if (savedNote) {
      noteTextArea.value = savedNote;
      saveButton.textContent = "Saved!";
      saveButton.disabled = true;
    } else {
      noteTextArea.value = "";
      saveButton.textContent = "Save";
      saveButton.disabled = false;
    }
  });

  return;
};



const setBookmarkAttributes = (src, eventListener, controlParentElement) => {
  const controlElement = document.createElement("img");

  controlElement.src = "assets/" + src + ".png";
  controlElement.title = src;
  controlElement.addEventListener("click", eventListener);
  controlParentElement.appendChild(controlElement);
};

document.addEventListener("DOMContentLoaded", async () => {
  const activeTab = await getActiveTabURL();
  const queryParameters = activeTab.url.split("?")[1];
  const urlParameters = new URLSearchParams(queryParameters);

  const currentVideo = urlParameters.get("v");

  if (activeTab.url.includes("youtube.com/watch") && currentVideo) {
    chrome.storage.sync.get([currentVideo], (data) => {
      const currentVideoBookmarks = data[currentVideo] ? JSON.parse(data[currentVideo]) : [];

      viewBookmarks(currentVideoBookmarks);
    });
  } else {
    const container = document.getElementsByClassName("container")[0];

    container.innerHTML = '<div class="title">This is not a youtube video page.</div>';
  }
});