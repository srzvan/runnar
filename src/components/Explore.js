import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { useCollectionData } from 'react-firebase-hooks/firestore';

import { formatFirebaseTimestamp, sortByTimestampDesc } from '../helpers';

import '../scss/components/_explore.scss';

function Explore(props) {
  const jogRoutesRef = props.firestore.collection('jogRoutes');
  const [jogRoutes, loading] = useCollectionData(jogRoutesRef, {
    idField: 'id',
  });

  function renderJogRoute(jogRoute, index) {
    return (
      <div key={index} className="jog-route">
        <Link to={`/jog-route/${jogRoute.id}`}>
          <p>
            <span>Created by: {jogRoute.owner.displayName}</span>
          </p>
          <p>@{formatFirebaseTimestamp(jogRoute.createdAt)}</p>
          <p className="jog-route__laps">Laps: {jogRoute.laps.length}</p>
          <p>Length: {jogRoute.length}km</p>
        </Link>
      </div>
    );
  }

  return (
    <div className="explore">
      <h3>Explore jogging routes</h3>
      {loading ? (
        <h4>Loading...</h4>
      ) : (
        <div className="container">
          {jogRoutes.sort(sortByTimestampDesc('createdAt')).map(renderJogRoute)}
        </div>
      )}
    </div>
  );
}

Explore.propTypes = {
  firestore: PropTypes.object.isRequired,
};

export default Explore;
