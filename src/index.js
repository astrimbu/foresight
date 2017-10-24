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


class ErrorMessage extends Component {

  render() {
    if (this.props.xml === false) {
      return (
        <div className="section top">
          <div className="box">
            <h3 className="red">File must be in XML format.</h3>
          </div>
        </div>
      )
    } else if (this.props.ccd === false) {
      return (
        <div className="section top">
          <div className="box">
            <h3 className="red">File is not a CCD.</h3>
            <p className="errorCCD">{this.props.error}</p>
          </div>
        </div>
      )
    } else if (this.props.missingVars.length > 0) {
      return (
        <div className="section top">
          <div className="box">
            <h3 className="red">Missing Laboratory Data</h3>
            <p className="errorCCD">
              This CCD is missing laboratory data for the following variables:
            </p>
            <p className="missingVars">
              <b>{this.props.missingVars.join(", ")}</b>
            </p>
          </div>
        </div>
      )
    } else return (<div></div>)
  }
}


class Variable extends Component {

  render() {
    let value
    let units
    if (this.props.value === '') {
      value = null
      units = null
    } else { 
      value = this.props.value
      if (this.props.units === undefined) {
        units = null
      } else { units = "(" + this.props.units + ")" }
    }

    return (
      <div className="section">
        <div className="col justifyRight">
          <b>{this.props.name}:</b>
        </div>
        <div className="col justifyLeft">
          {value} {units}
        </div>
      </div>
    )
  }
}


class Variables extends Component {

  render() {
    if (this.props.isCCD) {
      return (
        <div className="top">
          <h3 className="labData droid">Relevant Laboratory Data</h3>
          <Variable name="Sex" value={this.props.sex}/>
          <Variable name="Age" value={this.props.age} units="years"/>
          <Variable name="GFR" value={this.props.gfr} units="mL/min/1.73m²"/>
          <Variable name="ACR" value={this.props.acr} units="mg/g"/>
          <Variable name="Calcium" value={this.props.calcium} units="mg/dL"/>
          <Variable name="Phosphorous" value={this.props.phosphorous}
            units="mg/dL"/>
          <Variable name="Albumin" value={this.props.albumin} units="g/dL"/>
          <Variable name="Bicarbonate" value={this.props.bicarbonate} 
            units="mEq/L"/>
        </div>
      )
    } else { return (<div></div>) }
  }
}


class Results extends Component {

  render() {
    var riskResult
    let riskHeader
    let ckdRisk = this.props.ckdRisk
    if (this.props.ckdRisk !== null) {
      console.log(ckdRisk.parseFloat)
      if (parseFloat(ckdRisk) < 5.0) {
        riskHeader = <h2 className="green">{ckdRisk}%</h2>
      } else if (parseFloat(ckdRisk) < 15.0) {
        riskHeader = <h2 className="yellow">{ckdRisk}%</h2>
      } else {
        riskHeader = <h2 className="red">{ckdRisk}%</h2>
      }
      riskResult =
        <div className="box">
          <h3>Results</h3>
          <p>5-year risk of progression to kidney failure requiring dialysis or transplantation:</p>
          {riskHeader}
        </div>
    } else { riskResult = <div></div> }
    if (ckdRisk !== null) {
      return (
        <div className="top section">
          <Variables
            name={this.props.name}
            sex={this.props.sex}
            age={this.props.age}
            gfr={this.props.gfr}
            acr={this.props.acr}
            calcium={this.props.calcium}
            phosphorous={this.props.phosphorous}
            albumin={this.props.albumin}
            bicarbonate={this.props.bicarbonate}
            isCCD={this.props.isCCD}/>
          {riskResult}
        </div>
      )
    } else { return ( <div></div> ) }
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
      bicarbonate: '',
      ckdRisk: null,
      missingVars: []
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
    let gender = genderNode.getAttribute("code")
    this.setState({sex: gender})

    // Age
    let birthNode = xml.getElementsByTagName("birthTime")[0]
    let birthTime = birthNode.getAttribute("value")
    let age = this.calculateAge(birthTime)
    this.setState({age: age})

    // Lab Results
    try {  // some ccds don't have a structuredBody under topComponent
      this.getLabResultsSection(xml)
    } catch (e) {
      console.log("219: no structuredBody")
      this.setState({
        missingVars: ["GFR", "ACR", "Calcium", "Phosphorous", "Albumin",
          "Bicarbonate"]
      })
    }
  }

  calculateAge(dateString) {
    var y = dateString.substr(0,4),
        m = dateString.substr(4,2),
        d = dateString.substr(6,2)
    var date = y + '-' + m + '-' + d
    var today = new Date()
    var birthDate = new Date(date)
    var age = today.getFullYear() - birthDate.getFullYear()
    var mo = today.getMonth() - birthDate.getMonth()
    if (mo < 0 || (mo === 0 && today.getDate() < birthDate.getDate())) age--
    return age
  }

  getLabResultsSection(xml) {
    let topComponent = xml.getElementsByTagName("component")[0]
    let structuredBody = topComponent.getElementsByTagName("structuredBody")[0]
    let structuredBodyComponents =
      structuredBody.getElementsByTagName("component")
    for (let component of structuredBodyComponents) {
      let section = component.getElementsByTagName("section")[0]
      try {  // try-catch because some <section>'s don't contain <code>
        let codeNode = section.getElementsByTagName("code")[0]
        let code = codeNode.getAttribute("code")
        if (code === "30954-2") {
          this.setState({labResultsSectionPresent: true})
          let entries = section.getElementsByTagName("entry")
          // Should have getLabResults return something to indicate
          // whether lab data was found or not
          this.getLabResults(entries)
        }
      } catch (e) {}
    }
    if (this.state.labResultsSectionPresent === null) {
      this.missingAllLabVars()}
    } 

  missingAllLabVars() {
    this.setState({
      missingVars: ["GFR", "ACR", "Calcium", "Phosphorous", "Albumin",
        "Bicarbonate"]
    })
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
          break
      }
    }
    if (this.state.sex !== '' &&
        this.state.age !== '' &&
        this.state.gfr !== '' &&
        this.state.acr !== '' &&
        this.state.calcium !== '' &&
        this.state.phosphorous !== '' &&
        this.state.albumin !== '' &&
        this.state.bicarbonate !== '') {
      let calculatedRisk= this.calculateCKDRisk()
      this.setState({ckdRisk: calculatedRisk})
    } else {
      let missingVarsTemp = []
      if (this.state.sex === '') { missingVarsTemp.push("Sex") }
      if (this.state.age === '') { missingVarsTemp.push("Age") }
      if (this.state.gfr === '') { missingVarsTemp.push("GFR") }
      if (this.state.acr === '') { missingVarsTemp.push("ACR") }
      if (this.state.calcium === '') { missingVarsTemp.push("Calcium") }
      if (this.state.phosphorous === '') { missingVarsTemp.push("Phosphorous") }
      if (this.state.albumin === '') { missingVarsTemp.push("Albumin") }
      if (this.state.bicarbonate === '') { missingVarsTemp.push("Bicarbonate") }
      this.setState({missingVars: missingVarsTemp})
    }
  }

  getLabValue(organizer) {
    let component = organizer.getElementsByTagName("component")[0]
    let observation = component.getElementsByTagName("observation")[0]
    let valueNode = observation.getElementsByTagName("value")[0]
    let value = valueNode.getAttribute("value")
    return value
  }

  calculateCKDRisk() {
    let sumbetaxbar = -7.3920
    let sex
    if (this.state.sex === "M") { sex = 1 }
    else { sex = 0 }
    console.log('sex: ' + sex)
    let sumbetax = ((0.16117 * sex) + (-0.19883 * (this.state.age/10)) +
      (-0.49360 * (this.state.gfr/5)) + (0.35066 * Math.log(this.state.acr)) +
      (-0.22129 * this.state.calcium) + (0.24197 * this.state.phosphorous) +
      (-0.33867 * this.state.albumin) + (-0.07429 * this.state.bicarbonate))
    console.log('sumbetax: ' + sumbetax)
    let probability = 1 - Math.pow(0.929, Math.exp(sumbetax - sumbetaxbar))
    probability *= 100
    probability = probability.toFixed(1)
    return probability
  }

  determineCCD() {
    try {
      let typeId = this.state.ccdXML.getElementsByTagName("typeId")[0]
      var root = typeId.getAttribute("root")
      var ext = typeId.getAttribute("extension")
    } catch (e) { console.log("338: determineCCD()") }
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
    this.setState({ // reset variables so they don't persist btwn ccds
      name: '',
      sex: '',
      age: '',
      gfr: '',
      acr: '',
      calcium: '',
      phosphorous: '',
      albumin: '',
      bicarbonate: '',
      ckdRisk: null,
      missingVars: [],
      labResultsSectionPresent: null 
    })
    // try-catch because error is thrown when cancelling an upload
    // after a succesful document upload
    try {
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
    } catch (e) { console.log("373: handleFiles") }
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
        <p className="">
          To get started, upload your CCD.
        </p>
        <ReactFileReader handleFiles={this.handleFiles} fileTypes={'.xml'}>
          <button className="grommetStyleButton">Upload</button>
        </ReactFileReader>
        <ErrorMessage 
          xml={this.state.isXML} 
          ccd={this.state.isCCD}
          error={this.state.errorCCD}
          missingVars={this.state.missingVars}/>
        <Results ckdRisk={this.state.ckdRisk}/>
        <Variables
          name={this.state.name}
          sex={this.state.sex}
          age={this.state.age}
          gfr={this.state.gfr}
          acr={this.state.acr}
          calcium={this.state.calcium}
          phosphorous={this.state.phosphorous}
          albumin={this.state.albumin}
          bicarbonate={this.state.bicarbonate}
          isCCD={this.state.isCCD}/>
      </div>
    )
  }
}


ReactDOM.render(<App />, document.getElementById('root'));
registerServiceWorker();
