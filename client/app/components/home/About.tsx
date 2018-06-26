import * as React from 'react';
import { RouteComponentProps } from 'react-router-dom';

interface AboutState {}

class About extends React.Component<RouteComponentProps<{}>, AboutState> {
  constructor(props: RouteComponentProps<{}>) {
    super(props);

    this.state = {};
  }

  render() {
    return (
      <div>
        About Page!
      </div>
    );
  }
}

export default About;
