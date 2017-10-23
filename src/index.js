import React, { Component } from 'react';
import ReactDOM from 'react-dom';

import ReactFileReader from 'react-file-reader';

import './styles/app.css';
import registerServiceWorker from './registerServiceWorker';


class App extends Component {

  render() {
    return (
      <div className="App">
        <Header />
        <Foresight />
      </div>
    )
  }
}


class Header extends Component {

  render() {
    return (
      <div className="App-header">
        <h2>CKD Risk</h2>
      </div>
    )
  }
}


class XMLStatus extends Component {

  render() {
    if (this.props.status) {
      return <h3 className="green">XML!</h3>    
    } else if (this.props.status === null) {
      return <h3>XML?</h3>    
    } else {
      return <h3 className="red">Not XML</h3>
    }
  }
}

class CCDStatus extends Component {

  render() {
    if (this.props.status) {
      return <h3 className="green">CCD!</h3>    
    } else if (this.props.status === null) {
      return <h3>CCD?</h3>
    } else {
      return (
        <div>
          <h3 className="red">Not CCD</h3>    
          <p className="errorCCD">{this.props.error}</p>
        </div>
      )
    }
  }
}


class Variables extends Component {

  render() {
    return (
      <div className="box col">
        <h3>{this.props.name}</h3>
        <h3>Sex: {this.props.sex}</h3>
        <h3>Age: {this.props.age}</h3>
        <h3>eGFR: {this.props.gfr}</h3>
        <h3>ACR: {this.props.acr}</h3>
        <h3>Calcium: {this.props.calcium}</h3>
        <h3>Phosphorous: {this.props.phosphorous}</h3>
        <h3>Albumin: {this.props.albumin}</h3>
        <h3>Bicarbonate: {this.props.bicarbonate}</h3>
      </div>
    )
  }
}


class Foresight extends Component {

  constructor(props) {
    super(props)
    this.handleFiles = this.handleFiles.bind(this)

    this.state = {
      isXML: null, 
      isCCD: null,
      errorCCD: '',
      ccdText: '',
      ccdXML: '',
      name: '',
      sex: '',
      age: '',
      gfr: '',
      acr: '',
      calcium: '',
      phosphorous: '',
      albumin: '',
      bicarbonate: ''
    }
  }

  pullVars() {
    let xml = this.state.ccdXML

    // Name
    let givenNode = xml.getElementsByTagName("given")[0]
    let firstName = givenNode.childNodes[0].nodeValue
    let familyNode = xml.getElementsByTagName("family")[0]
    let lastName = familyNode.childNodes[0].nodeValue
    let fullName = firstName + ' ' + lastName
    this.setState({name: fullName})

    // Sex
    let genderNode = xml.getElementsByTagName("administrativeGenderCode")[0]
    let gender = genderNode.getAttribute("displayName")
    this.setState({sex: gender})

    // Age
    let birthNode = xml.getElementsByTagName("birthTime")[0]
    let birthTime = birthNode.getAttribute("value")
    let age = this.calculateAge(birthTime)
    this.setState({age: age})

    this.getLabResultsSection(xml)
  }

  calculateAge(dateString) {
    var y = dateString.substr(0,4),
        m = dateString.substr(4,2),
        d = dateString.substr(6,2)
    var date = y + '-' + m + '-' + d
    var today = new Date()
    var birthDate = new Date(date)
    var age = today.getFullYear() - birthDate.getFullYear()
    var m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  getLabResultsSection(xml) {
    let labVarsSection
    let topComponent = xml.getElementsByTagName("component")[0]
    let structuredBody = topComponent.getElementsByTagName("structuredBody")[0]
    let structuredBodyComponents =
      structuredBody.getElementsByTagName("component")
    for (let component of structuredBodyComponents) {
      let section = component.getElementsByTagName("section")[0]
      try {
        // try-catch because some <section>'s don't contain <code>
        let codeNode = section.getElementsByTagName("code")[0]
        let code = codeNode.getAttribute("code")
        if (code === "30954-2") {
          labVarsSection = section
          console.log(labVarsSection)
          let entries = section.getElementsByTagName("entry")
          this.getLabResults(entries)
        }
      } catch (e) {}
    }
  } 

  getLabResults(entries) {
    for (let entry of entries) {
      let organizer = entry.getElementsByTagName("organizer")[0]
      let codeNode = organizer.getElementsByTagName("code")[0]
      let code = codeNode.getAttribute("code")
      let value = this.getLabValue(organizer)
      switch (code) {
        case "33914-3":
          this.setState({gfr: value})
          break
        case "14959-1":
          this.setState({acr: value})
          break
        case "1751-7":
          this.setState({albumin: value})
          break
        case "2777-1":
          this.setState({phosphorous: value})
          break
        case "14627-4":
          this.setState({bicarbonate: value})
          break
        case "17861-6":
          this.setState({calcium: value})
          break
        default:
          console.log("irrelevent: " + code)
      }
    }
  }

  getLabValue(organizer) {
    let component = organizer.getElementsByTagName("component")[0]
    let observation = component.getElementsByTagName("observation")[0]
    let valueNode = observation.getElementsByTagName("value")[0]
    let value = valueNode.getAttribute("value")
    return value
  }


  determineCCD() {
    try {
      let typeId = this.state.ccdXML.getElementsByTagName("typeId")[0]
      var root = typeId.getAttribute("root")
      var ext = typeId.getAttribute("extension")
    } catch (e) {}
    let ccdRoot = "2.16.840.1.113883.1.3"
    let ccdExt = "POCD_HD000040"
    if ((root === ccdRoot) && (ext === ccdExt)) {
      this.setState({isCCD: true})
      this.pullVars()
    } else {
      this.setState({
        isCCD: false,
        errorCCD: "This file does not have a valid typeId root and/or " +
                  "extension. Please upload a CCD with a valid header." 
      })
    }
  }

  handleFiles = files => {
    const extension = files[0].name.split('.').pop().toLowerCase()
    this.setState({isXML: (extension === 'xml')})
    if (extension === 'xml') {
      var reader = new FileReader()
      reader.onload = e => {
        let contents = reader.result
        this.setState({ccdText: contents})
        this.textToXML(contents)
      }
      reader.readAsText(files[0])
    } else { this.setState({isCCD: false}) }
  }

  textToXML(text) {
    var parseXML  // function definition depends on browser
    if (typeof window.DOMParser !== "undefined") {
      parseXML = function(text) {
        return (new window.DOMParser()).parseFromString(text, "text/xml")
      }
    } else if (typeof window.ActiveXObject !== "undefined" &&
               new window.ActiveXObject("Microsoft.XMLDOM")) {
      parseXML = function(text) {
        var xml = new window.ActiveXObject("Microsoft.XMLDOM")
        xml.async = "false"
        xml.loadXML(text)
        return xml
      }
    } else { throw new Error("No XML parser found") }
    var xml = parseXML(text)
    this.setState({ccdXML: xml})
    this.determineCCD()
  }

  render() {
    return (
      <div className="Foresight">
        <p className="App-intro">
          To get started, upload your <code>CCD</code>.
        </p>
        <ReactFileReader handleFiles={this.handleFiles} fileTypes={'.xml'}>
          <button>Upload</button>
        </ReactFileReader>
        <div className="section">
          <div className="box col">
            <XMLStatus status={this.state.isXML}/>
            <CCDStatus status={this.state.isCCD} error={this.state.errorCCD}/>
          </div>
          <Variables
            name={this.state.name}
            sex={this.state.sex}
            age={this.state.age}
            gfr={this.state.gfr}
            acr={this.state.acr}
            calcium={this.state.calcium}
            phosphorous={this.state.phosphorous}
            albumin={this.state.albumin}
            bicarbonate={this.state.bicarbonate}/>
        </div>
      </div>
    )
  }
}


ReactDOM.render(<App />, document.getElementById('root'));
registerServiceWorker();
