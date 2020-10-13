import React, { useEffect, useState } from 'react';
import { useForm } from "react-hook-form";
import axios from 'axios';
import {useLocation, setLinksHandler} from './useLocation';
import {Router, loc} from 'react-enroute';
import { createStore, useStoreState, StoreProvider, action, thunk, computed, useStoreActions } from 'easy-peasy';

import './index.css'

import DayPicker from 'react-day-picker';
import 'react-day-picker/lib/style.css';

const api = {
  getReleases: () => axios.get(`https://lushlog.web.app/api/v1/releases`),
  create: (data) => axios.post(`https://lushlog.web.app/api/v1/releases`, data),
  delete: (id) => axios.delete(`https://lushlog.web.app/api/v1/releases/${id}`),
  addItem: (id, data) => axios.post(`https://lushlog.web.app/api/v1/releases/${id}/items`, data),
}

const releases = [
  {
    id: 1,
    date: new Date('August 30, 2020'),
    number: 'v9.36.0',
    published: true,
    items: [
      {
        text: 'Responses search only finding responses shared with a team',
        type: 'improved'
      },
      {
        text: 'Responses search only finding responses shared with a team',
        type: 'fixed'
      },
      {
        text: 'Responses search only finding responses shared with a team',
        type: 'new',
        note: '“Email address already taken”, “Password must have at least 8 characters”, etc.',
        img: "https://d35aizeh8x21c1.cloudfront.net/assets/changelog/remote-work-31191d26d86339aed64b32adbe3c3040ccfefce53935c0b71e355554ffb1fc6759.png"
      }
    ]
  },
  {
    id: 2,
    date: new Date('August 29, 2020'),
    number: 'v9.35.0',
    published: true,
    items: [
      {
        text: 'Responses search only finding responses shared with a team',
        type: 'new',
        link: {
          href: 'https://google.com',
          text: 'Read more'
        },
        img: "https://d35aizeh8x21c1.cloudfront.net/assets/changelog/remote-work-31191d26d86339aed64b32adbe3c3040ccfefce53935c0b71e355554ffb1fc6759.png"
      }
    ]
  },
  {
    id: 3,
    date: new Date('August 28, 2020'),
    number: 'v9.34.0',
    published: true,
    items: [
      {
        text: 'Responses search only finding responses shared with a team',
        type: 'new',
        link: {
          href: 'https://google.com',
          text: 'Read more'
        }
      }
    ]
  }
];

const storeModel = {
  releases: {
    data: [],
    setData: action((state, payload) => {
      state.data = payload;
    }),
    addData: action((state, payload) => {
      state.data = [...state.data, payload]
    }),
    addReleaseItem: action((state, payload) => {
      const {id, item} = payload;
      const release = state.data.find(r => r.id === id);
      release.items.push(item);
      state.data = [...state.data.filter(r => r.id !== id), release];
    }),
    removeData: action((state, payload) => {
      const {id} = payload;
      state.data = [...state.data.filter(r => r.id !== id)]
    }),
    fetch: thunk(async (actions, payload) => {
      const response = await api.getReleases(payload);
      if (response && response.data) {
        actions.setData(response.data);
        return response.data;
      }
    }),
    create: thunk(async (actions, payload) => {
      const response = await api.create(payload);
      if (response && response.data) {
        actions.addData(response.data);
        return response.data;
      }
    }),
    delete: thunk(async (actions, { id }) => {
      const response = await api.delete(id);
      if (response && response.data) {
        const data = response.data;
        actions.removeData(data);
        return response.data;
      }
    }),
    releaseById: computed(state => id => state.data.find(item => item.id === id)),
    addItem: thunk(async (actions, payload) => {
      const { id, item } = payload;
      const response = await api.addItem(id, item);
      if (response && response.data) {
        actions.addReleaseItem({ id, item: response.data });
        return response.data;
      }
      return null;
    }),
  },
} 

const store = createStore(storeModel);

const COLORS = {
  'new': 'green',
  'improved': 'blue',
  'fixed': 'orange',
}

const Release = ({ release }) => {
  const {items = [] , date, data: {title: number}, id} = release;
  const deleteRelease = useStoreActions(actions => actions.releases.delete);
  const itemsMap = items.reduce((memo, i) => {
    const type = i.data.type;
    memo[type] = memo[type] || [];
    memo[type].push(i);
    return memo;
  },{});

  const onDelete = () => {
    deleteRelease({ id });
  };

  return (
    <div className="pl-8 mt-8">
      <div className="flex justify-between px-2 pb-2">
        <h2 className="leading-5 text-2xl font-light text-gray-900">
          {
            new Intl.DateTimeFormat("en-GB", {
              year: "numeric",
              month: "long",
              day: "2-digit"
              }).format(date)
          }
          <small className="text-sm pl-1">{number}</small>
        </h2>
        <button className="text-gray-500 pl-2" onClick={onDelete}>Delete</button>
      </div>
      { Object.keys(COLORS).map((category) => <ReleaseCategory key={`${id}-${category}`}category={category} items={ itemsMap[category] } release={release} />)}
    </div>
  );
};

const ReleaseCategory = ({category, items = [], release}) => {
  return (
    <div className="flex-col flex">
      <ul>
        {items.map((item, index) => <ReleaseItem key={`release-item-${index}`} item={item}/> )}
        <NewReleaseItem type={category} release={release} />
      </ul>

    </div>
  );
}

const NewReleaseItem = ({type, release}) => {
  const { register, handleSubmit, watch, errors, reset } = useForm();
  const addItem = useStoreActions(actions => actions.releases.addItem);
  const { id } = release;

  const text = watch('text');

  const onSubmit = async (data) => {
    const { text } = data; 
    const item = { text, type };
    reset();
    await addItem({ id, item });
  };

  return (
    <li className="flex p-2 relative flex flex-col border-transparent rounded-md">
      <span className={`shadow mr-2 absolute inline-block text-xs rounded font-bold px-1 bg-${COLORS[type]}-400 text-white uppercase`} style={{right: '100%'}}>{type}</span>
      <div className="text-gray-500 block w-full flex justify-between">
        <div className="flex-1">
          <form onSubmit={handleSubmit(onSubmit)}>
            <input ref={register({ required: true })}
                    type="text" 
                    name="text" 
                    className="appearance-none w-full text-gray-700 leading-tight focus:outline-none" />
          </form>
        </div>
        {
          text ?
          <div>
            <button className="text-gray-400 hover:text-gray-500" onClick={reset}>
              <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div> 
          : null
        }
      </div>
    </li>
  );
};

const ReleaseItem = ({item}) => {
  const [isShown, setIsShown] = useState(false);
  const { id, data: { type, text, link, note, img }} = item;
 
  return(
    <li className="flex p-2 relative flex flex-col border-transparent border hover:border-gray-200 cursor-move rounded-md" 
        onMouseEnter={() => setIsShown(true)}
        onMouseLeave={() => setIsShown(false)}>
      <span className={`shadow mr-2 absolute inline-block text-xs rounded font-bold px-1 bg-${COLORS[type]}-400 text-white uppercase`} style={{right: '100%'}}>{type}</span>
      <div className="text-gray-500 block w-full flex justify-between">
        <div className="flex-1">
        {text}
        {
          link ?
          <> &nbsp;&bull; <a className="text-blue-600 hover:underline" href={link.href}>{link.text}</a> </>
          : null
        }
        </div>
        {
          isShown ?
          <div>
            <button className="text-gray-400 hover:text-gray-500">
              <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
            </button>

            <button className="text-gray-400 hover:text-gray-500">
              <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
          : null
        }
      </div>
      {
        note ?
        <div className="note mt-2 mb-3 text-sm text-gray-400">
          {note}
        </div>
        : null
      }
      {
        img ? 
        <div className="image mt-2 w-full">
          <img src={img} className="rounded w-1/3"></img>
        </div>
        : null
      }
    </li> 
  ) 
};

const Changelog = () => {
  const { register, handleSubmit, watch, errors, reset } = useForm();
  const releases = useStoreState(state => state.releases.data);
  const fetch = useStoreActions(actions => actions.releases.fetch);
  const create = useStoreActions(actions => actions.releases.create);
  const [isOpen, setIsOpen ] = useState(false);

  useEffect(() => {
    fetch();
  }, [])
  
  const onSubmit = async (data) => {
    await create(data);
    close();
  };

  const close = () => {
    reset();
    setIsOpen(false);
  };

  return(
  
      <div className="ml-15 mr-4 max-w-3xl md:mx-auto mb-20">
        <DayPicker />
        <div className="flex justify-center pt-4">
          {
            isOpen ?
            <div className="pl-8 border-gray-200 rounded-md w-full">
              <form className="w-full" onSubmit={ handleSubmit(onSubmit) }>
                <div className="flex justify-between">
                  <div className="flex">
                    <input ref={register({ required: true })} name="title" className="border border-gray-300 appearance-none w-full text-gray-700 mr-3 py-2 px-2 leading-tight focus:outline-none rounded-md" type="text" placeholder="Name" />
                    <input ref={register({ required: true })} name="date" className="border border-gray-300 appearance-none w-full text-gray-700 mr-3 py-2 px-2 leading-tight focus:outline-none rounded-md" type="text" placeholder="Date" />
                  </div>
                  <div className="">
                    <button className="flex-shrink-0 bg-blue-500 hover:bg-blue-700 border-blue-500 hover:border-blue-700 text-sm border-4 text-white px-2 rounded-lg" type="submit">
                      Save
                    </button>
                    <button onClick= { e => close() } className="flex-shrink-0 border-transparent border-4 text-blue-500 hover:text-blue-800 text-sm py-1 px-2 rounded" type="button">
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            </div>
            : <button onClick= { e => setIsOpen(true) } className="flex items-center bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-2 px-4 border border-blue-500 hover:border-transparent rounded-lg">
              <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>

              <span className="pl-3">New Release</span>
            </button>
          }
        </div>
        <section>
          { releases.sort((a,b) => b.date - a.date).map((r,index) => <Release key={`release-${index}`} release={r} items={[]} date={'date'} number={r.data.title} />) }
        </section>
      </div>
  )
}

function NotFound() {
  return <p>404 Not Found</p>
}

const Layout = ({location, children}) => {
  return (
    <>
      <div className="min-h-screen h-full">
        {children}
      </div>
    </>
  )
};


export const App = () => {
  const location = useLocation();

  useEffect(setLinksHandler, []);

  return (
    <StoreProvider store={store}>
      <Router {...{location}}>
        <Layout {...{location}}>
          <Changelog path='changelog'/>
        </Layout>
        <NotFound path='(.*)'/>
      </Router>
    </StoreProvider>
  );
};