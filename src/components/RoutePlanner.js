import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useDrop } from 'react-dnd';
import firebase from 'firebase/app';

import RouteLap from './RouteLap';

import { DragItemTypes, laps } from '../constants';
import { formatDistanceInKms } from '../helpers';

import '../scss/components/_route-planner.scss';

function RoutePlanner(props) {
  const [jogRoute, setJogRoute] = useState([]);
  const newJogRouteRef = props.firestore.collection('jogRoutes').doc();
  const currentJoggerRef = props.firestore
    .collection('joggers')
    .doc(props.user.uid);

  const [{ isOver: isOverDropZone, canDrop }, drop] = useDrop({
    accept: DragItemTypes.LAP,
    drop: (item) => {
      setJogRoute([...jogRoute, { name: item.name, length: item.length }]);
    },
    canDrop: (item) => {
      if (isLapEligible(item)) {
        return true;
      }

      return false;
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  });

  function isLapEligible(lap) {
    var isEligible = true;

    if (jogRoute.length !== 0) {
      const currentLastLap = [...jogRoute].pop();

      switch (lap.name) {
        case 'small':
        case 'medium':
        case 'large':
          if (currentLastLap.name === laps.xxlarge.name) {
            isEligible = false;
          }

          break;
        case 'xlarge':
          if (currentLastLap.name === laps.medium.name) {
            isEligible = false;
          }

          break;
        case 'xxlarge':
          if (
            currentLastLap.name === laps.small.name ||
            currentLastLap.name === laps.medium.name ||
            currentLastLap.name === laps.large.name
          ) {
            isEligible = false;
          }

          break;
        default:
          break;
      }
    }

    return isEligible;
  }

  function getDropzoneClassNames() {
    var classNames = ['drop-zone'];

    if (isOverDropZone && canDrop) {
      classNames.push('drop-zone--eligible');
    }

    if (isOverDropZone && !canDrop) {
      classNames.push('drop-zone--ineligible');
    }

    if (!isOverDropZone && canDrop) {
      classNames.push('drop-zone--highlight');
    }

    return classNames.join(' ');
  }

  function removeLap(index) {
    const newJogRoute = [...jogRoute];
    newJogRoute.splice(index, 1);
    setJogRoute(newJogRoute);
  }

  function getJogRouteLength() {
    const jogRouteLength = jogRoute.reduce((acc, curr) => acc + curr.length, 0);

    return formatDistanceInKms(jogRouteLength);
  }

  function clearJogRoute() {
    setJogRoute([]);
  }

  function saveJogRoute() {
    var batch = props.firestore.batch();
    var laps = jogRoute.map(function getName(lap) {
      return lap.name;
    });
    var jogRouteLength = getJogRouteLength();

    var newJogRoute = {
      owner: {
        displayName: props.user.displayName,
        uid: props.user.uid,
      },
      laps,
      length: jogRouteLength,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    };

    batch.set(newJogRouteRef, newJogRoute);
    batch.update(currentJoggerRef, {
      jogRoutes: firebase.firestore.FieldValue.increment(1),
    });

    batch
      .commit()
      .then(function success() {
        console.log('Batch writes successfully commited ✨!');
      })
      .catch(function error(err) {
        console.error('Batch write failed 🚧! Reason:', err);
      });

    clearJogRoute();
  }

  return (
    <div className="route-planner" data-testid="route-planner">
      <h2>Route planner</h2>
      {jogRoute.length > 1 && (
        <button onClick={saveJogRoute}>Save route</button>
      )}
      <button onClick={clearJogRoute}>Clear jog route</button>
      <div
        ref={drop}
        className={getDropzoneClassNames()}
        data-testid="drop-zone"
      >
        {jogRoute.map((lap, index) => (
          <RouteLap
            key={index}
            index={index}
            lapName={lap.name}
            length={lap.length}
            removeLap={removeLap}
            className={`route-lap--${lap.name}`}
          />
        ))}
      </div>
      {jogRoute.length >= 1 && (
        <p className="route-planner__length">
          <span className="label">Total length</span>
          {getJogRouteLength()} km
        </p>
      )}
    </div>
  );
}

RoutePlanner.propTypes = {
  firestore: PropTypes.object.isRequired,
  user: PropTypes.object.isRequired,
};

export default RoutePlanner;
