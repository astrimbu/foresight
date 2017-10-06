import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import ReactFileReader from 'react-file-reader';
import XMLParser from 'react-xml-parser';
import './styles/app.css';
import logo from './logo.svg';
import registerServiceWorker from './registerServiceWorker';


class App extends Component {
  constructor(props) {
    super(props)
    this.handleFiles = this.handleFiles.bind(this)

    this.state = {
      ccdText: ''
    }
  }

  handleFiles = files => {
    var reader = new FileReader()
    reader.onload = e => {
      let contents = reader.result
      this.setState({ccdText: contents})
      console.log(this.state.ccdText)
    }
    reader.readAsText(files[0])
  }

  render() {
    return (
      <div className="App">
        <div className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h2>Welcome to Foresight</h2>
        </div>
        <p className="App-intro">
          To get started, upload your <code>CCD</code>.
        </p>
        <ReactFileReader handleFiles={this.handleFiles} fileTypes={'.xml'}>
          <button>Upload</button>
        </ReactFileReader>
      </div>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('root'));
registerServiceWorker();
