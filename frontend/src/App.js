import logo from './logo.svg';
import './App.css';
import React, { useState } from 'react';
import UserText from './components/Editor';
import Editor from './components/Editor';

function App() {
  return (
    <div className="App">
      <Editor></Editor>
    </div>
  );
}

export default App;
