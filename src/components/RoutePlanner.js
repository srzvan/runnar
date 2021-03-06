import React, { useContext, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useDrop } from 'react-dnd';
import firebase from 'firebase/app';

import RouteLap from './RouteLap';

import { FirestoreContext } from './App';
import { DragItemTypes, laps, LOCAL_STORAGE_KEYS } from '../constants';
import { formatDistanceInKms } from '../helpers';

import '../scss/components/_route-planner.scss';

function RoutePlanner(props) {
  const firestore = useContext(FirestoreContext);
  const [jogRoute, setJogRoute] = useState([]);

  const currentlyEditingJogRouteId = useRef();
  const isEditExistingRoute = useRef();

  useEffect(initWithEditExistingRoute, []);

  const [{ isOver: isOverDropZone, canDrop }, drop] = useDrop({
    accept: DragItemTypes.LAP,
    drop: (item) => {
      setJogRoute([...jogRoute, item.name]);
    },
    canDrop: function canDrop(item) {
      return isLapEligible(item);
    },
    collect: function collect(monitor) {
      return {
        isOver: !!monitor.isOver(),
        canDrop: !!monitor.canDrop(),
      };
    },
  });

  function initWithEditExistingRoute() {
    var currentlyEditingJogRoute = JSON.parse(
      localStorage.getItem(LOCAL_STORAGE_KEYS.CURRENTLY_EDITING_JOG_ROUTE)
    );

    if (currentlyEditingJogRoute) {
      let normalizedJogRoute = [];

      for (let lapName of currentlyEditingJogRoute.laps) {
        normalizedJogRoute.push(lapName);
      }

      setJogRoute(normalizedJogRoute);
      currentlyEditingJogRouteId.current = currentlyEditingJogRoute.id;
      isEditExistingRoute.current = true;
      localStorage.removeItem(LOCAL_STORAGE_KEYS.CURRENTLY_EDITING_JOG_ROUTE);
    }
  }

  function isLapEligible(lap) {
    var isEligible = true;

    if (jogRoute.length !== 0) {
      const currentLastLap = [...jogRoute].pop();

      switch (lap.name) {
        case 's':
        case 'm':
        case 'l':
          if (currentLastLap.name === laps.xxl.name) {
            isEligible = false;
          }

          break;
        case 'xl':
          if (currentLastLap.name === laps.m.name) {
            isEligible = false;
          }

          break;
        case 'xxl':
          if (
            currentLastLap.name === laps.s.name ||
            currentLastLap.name === laps.m.name ||
            currentLastLap.name === laps.l.name
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

  function removeLap(index) {
    const newJogRoute = [...jogRoute];
    newJogRoute.splice(index, 1);
    setJogRoute(newJogRoute);
  }

  function getJogRouteLength() {
    const jogRouteLength = jogRoute.reduce(
      (total, currentLapName) => total + laps[currentLapName].getLapLength(),
      0
    );

    return formatDistanceInKms(jogRouteLength);
  }

  function clearJogRoute() {
    setJogRoute([]);
  }

  async function saveJogRoute() {
    var batch = firestore.batch();

    var newJogRouteRef = firestore.collection('jogRoutes').doc();
    var currentJoggerRef = firestore.collection('joggers').doc(props.user.uid);

    var jogRouteLength = getJogRouteLength();

    var newJogRoute = {
      owner: {
        displayName: props.user.displayName,
        uid: props.user.uid,
      },
      laps: jogRoute,
      length: jogRouteLength,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    };

    batch.set(newJogRouteRef, newJogRoute);
    batch.update(currentJoggerRef, {
      jogRoutes: firebase.firestore.FieldValue.increment(1),
    });

    try {
      await batch.commit();
      console.log('Batch writes successfully commited ✨!');
    } catch (err) {
      console.error('Batch write failed 🚧! Reason:', err);
    }
  }

  async function updateJogRoute() {
    var jogRouteRef = firestore
      .collection('jogRoutes')
      .doc(currentlyEditingJogRouteId.current);

    var jogRouteLength = getJogRouteLength();

    try {
      await jogRouteRef.update({
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        laps: jogRoute,
        length: jogRouteLength,
      });
    } catch (err) {
      console.error('Update jog route failed 🚧! Reason:', err);
    }
  }

  function renderActions() {
    if (jogRoute.length > 1) {
      return (
        <div className="route-planner__actions">
          <button
            className="button button--large"
            onClick={
              isEditExistingRoute.current ? updateJogRoute : saveJogRoute
            }
          >
            {isEditExistingRoute.current ? 'Update' : 'Save'} jog route
          </button>
          <button className="button button--large" onClick={clearJogRoute}>
            Clear
          </button>
        </div>
      );
    }

    return null;
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

  return (
    <div className="route-planner" data-testid="route-planner">
      <h2>Route Planner - {isEditExistingRoute.current ? 'edit' : 'create'}</h2>
      <div
        ref={drop}
        className={getDropzoneClassNames()}
        data-testid="drop-zone"
      >
        {jogRoute.map((lapName, index) => (
          <RouteLap
            key={index}
            index={index}
            lapName={lapName}
            removeLap={removeLap}
          />
        ))}
      </div>
      {renderActions()}
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
  user: PropTypes.object.isRequired,
};

export default RoutePlanner;
