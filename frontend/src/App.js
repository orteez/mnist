import React, { useState } from 'react';
import './App.css';

import { SketchField, Tools } from 'react-sketch';
import {PYTHON_BACKEND} from "./urls";

import { ListGroup, ListGroupItem, Container, Button, Modal, ModalBody, ModalFooter, ModalHeader, InputGroup, Input } from 'reactstrap';

function App() {
  const [sketch, setSketch] = useState(null)
  const [prediction, setPrediction] = useState(null);
  const [predictionList, setPredictionList] = useState([]);

  const [modal, setModal] = useState(false);
  const [correctNumber, setCorrectNumber] = useState(null);

  const toggle = () => setModal(!modal);

  const onSubmit = async () => {
    const image = sketch.toDataURL();
    const resp = await fetch(PYTHON_BACKEND + "/predict", {
      method: 'POST',
      mode: 'cors', // no-cors, *cors, same-origin
      cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
      credentials: 'same-origin', // include, *same-origin, omit
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ "data": image })
    })

    const content = await resp.json();

    console.log(content);

    if (content["prediction"] != null) {
      setPrediction(content["prediction"])
      setPredictionList(content["predictions"])
    } else {
      alert("Error... Please try again.")
    }

  }

  const onErase = () => {
    sketch.clear()
    setPredictionList([])
    setPrediction(null)
  }

  const onCorrect = () => {
    alert("Thank you for verfying!")
  }

  const onIssue = () => {
    toggle();
  }

  const onSubmitUpdate = async () => {
    if (correctNumber === null || correctNumber < 0 || correctNumber > 9) {
      alert("Number needs to be between values 0 and 9");
      return;
    }

    const image = null || sketch.toDataURL();
    const resp = await fetch(PYTHON_BACKEND + "/correction", {
      method: 'POST',
      mode: 'cors', // no-cors, *cors, same-origin
      cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
      credentials: 'same-origin', // include, *same-origin, omit
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ "image": image, "number": correctNumber })
    })

    if(!resp.ok) {
      alert("Error submitting correction. Please try again or contact support.")
      toggle();
      return;
    }

    const content = await resp.json();
    console.log(content);

    setCorrectNumber(null);

    toggle();
  }

  const onCancelUpdate = () => {
    toggle();
  }

  return (
    <div className="App">
      <div className="App-header">
        <h1>MNIST MACHINE LEARNING DRAWER</h1>
        <SketchField width='500px'
          height='500px'
          tool={Tools.Pencil}
          lineColor='black'
          lineWidth={20}
          ref={c => setSketch(c)}
          forceValue
          className="sketch"
        />
        <Container>
          <Button className="Buttons" color="success" onClick={onSubmit}>Submit</Button>
          <Button className="Buttons" color="danger" onClick={onErase}>Erase</Button>
        </Container>
        <Container style={{ "width": "20%", "minWidth": "400px" }}>
          <ListGroup>
            <ListGroupItem>
              <span style={{ "float": "left" }}>digits</span>
              <span style={{ "float": "right" }}>accuracy</span>
            </ListGroupItem>
            {
              predictionList.map((nums, i) =>
                <ListGroupItem key={i} style={{ "backgroundColor": i === prediction ? "green" : "white" }}>
                  <span style={{ "float": "left" }}>{i}</span>
                  <span style={{ "float": "right" }}>{nums.toFixed(4)}</span>
                </ListGroupItem>
              )
            }
          </ListGroup>
          {
            predictionList.length > 0 && (
              <Container>
                Was the prediction correct?
                <Button className="Buttons" color="success" onClick={onCorrect}>Yes</Button>
                <Button className="Buttons" color="danger" onClick={onIssue}>No</Button>
                <Modal isOpen={modal} toggle={toggle}>
                  <ModalHeader toggle={toggle}>Correct Value</ModalHeader>
                  <ModalBody>
                    Please enter the correct value you intended to draw.
                    <Input placeholder="Number" min={0} max={9} type="number" step="1" value={correctNumber} onChange={ e => setCorrectNumber(e.target.value)}/>
                  </ModalBody>
                  <ModalFooter>
                    <Button color="primary" onClick={onSubmitUpdate}>Submit</Button>{' '}
                    <Button color="secondary" onClick={onCancelUpdate}>Cancel</Button>
                  </ModalFooter>
                </Modal>
              </Container>
            )
          }
        </Container>
      </div>
    </div>
  );
}

export default App;
