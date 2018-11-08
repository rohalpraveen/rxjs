import { createSubscriber } from 'rxjs/internal/RxSubscriber';
import { expect } from 'chai';
import { FOType, Sink, Subscription } from 'rxjs';

describe('Subscriber', () => {
  let mockDestCalls: Array<{ type: FOType, arg: any }>;
  let mockDest: Sink<any>;

  beforeEach(() => {
    mockDestCalls = [];
    mockDest = (type: FOType, arg: any) => {
      mockDestCalls.push({ type, arg });
    };
  });

  it('should flag closed if completed', () => {
    const subs = new Subscription();
    const subscriber = createSubscriber(mockDest, subs);

    subscriber.next(1);
    expect(subscriber.closed).to.be.false;
    subscriber.next(2);
    expect(subscriber.closed).to.be.false;
    subscriber.complete();
    expect(subscriber.closed).to.be.true;
    subscriber.next(3);
    expect(subscriber.closed).to.be.true;
  });

  it('should send appropriate messages to the destination with completions', () => {
    const subs = new Subscription();
    const subscriber = createSubscriber(mockDest, subs);

    subscriber.next(1);
    subscriber.next(2);
    subscriber.complete();
    subscriber.next(3);

    expect(mockDestCalls).to.deep.equal([
      { type: FOType.NEXT, arg: 1 },
      { type: FOType.NEXT, arg: 2 },
      { type: FOType.COMPLETE, arg: undefined },
    ]);
  });

  it('should send appropriate messages to the destination with an error', () => {
    const subs = new Subscription();
    const subscriber = createSubscriber(mockDest, subs);
    const err = new Error('bad');

    subscriber.next(1);
    subscriber.next(2);
    subscriber.error(err);
    subscriber.next(3);

    expect(mockDestCalls).to.deep.equal([
      { type: FOType.NEXT, arg: 1 },
      { type: FOType.NEXT, arg: 2 },
      { type: FOType.ERROR, arg: err },
    ]);
  });

  it('should unsubscribe subscriptions sent to it when it completes', () => {
    let unsubbed = false;
    const subs = new Subscription(() => unsubbed = true);
    const subscriber = createSubscriber(mockDest, subs);

    expect(unsubbed).to.be.false;
    subscriber.next(1);
    expect(unsubbed).to.be.false;
    subscriber.complete();
    expect(unsubbed).to.be.true;
  });

  it('should unsubscribe subscriptions sent to it when it errors', () => {
    let unsubbed = false;
    const subs = new Subscription(() => unsubbed = true);
    const subscriber = createSubscriber(mockDest, subs);

    expect(unsubbed).to.be.false;
    subscriber.next(1);
    expect(unsubbed).to.be.false;
    subscriber.error(new Error());
    expect(unsubbed).to.be.true;
  });
});