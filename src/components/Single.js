import React, { useContext } from 'react';
import { useRouteMatch } from 'react-router';
import { useDocumentData } from 'react-firebase-hooks/firestore';

import Loader from './Loader';

import { FirestoreContext } from './App';
import { formatFirebaseTimestamp } from '../helpers';

import '../scss/components/_single.scss';

function Single(props) {
  const firestore = useContext(FirestoreContext);
  const match = useRouteMatch();
  const jogRouteRef = firestore
    .collection('jogRoutes')
    .doc(match.params.jogRouteId);
  const [jogRoute, loading] = useDocumentData(jogRouteRef);

  return (
    <div className="single">
      {loading ? (
        <Loader />
      ) : (
        <>
          <p className="single__author">
            <span className="label">By</span>
            <span>{jogRoute.owner.displayName}</span>
            <span className="single__timestamp">
              {formatFirebaseTimestamp(jogRoute.createdAt)}
            </span>
          </p>
          <p className="single__length">
            <span className="label">Length</span>
            {jogRoute.length}km
          </p>
          <p className="single__no-of-laps">
            <span className="label">No. of laps</span>
            {jogRoute.laps.length}
          </p>
          <p className="single__laps-order">
            <span className="label">Laps order</span>
            {jogRoute.laps.map(function renderLap(lapName, index) {
              return <span key={index}>{lapName}</span>;
            })}
          </p>
        </>
      )}
    </div>
  );
}

export default Single;
