import logo from "./logo.svg";
import "./App.css";
import React, { useState } from "react";
import Editor from "./components/Editor";

import Thankyou from "./components/Thankyou" 
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link
} from "react-router-dom";

 

function App() {
  return (
    
    <div className="App">
      {/* <Editor></Editor> */}
      <Router>
        
        <Switch>
          <Route exact path="/">
            <Editor></Editor>
          </Route>
          <Route exact path="/thankyou">
            <Thankyou></Thankyou>
          </Route>
        </Switch>
      </Router> 
    </div>
  );
}

export default App;
