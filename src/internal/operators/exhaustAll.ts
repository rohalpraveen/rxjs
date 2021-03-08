import { Subscription } from '../Subscription';
import { ObservableInput, OperatorFunction } from '../types';
import { operate } from '../util/lift';
import { innerFrom } from '../observable/from';
import { OperatorSubscriber } from './OperatorSubscriber';

export function exhaustAll<T>(): OperatorFunction<ObservableInput<T>, T>;
export function exhaustAll<R>(): OperatorFunction<any, R>;

/**
 * Converts a higher-order Observable into a first-order Observable by dropping
 * inner Observables while the previous inner Observable has not yet completed.
 *
 * <span class="informal">Flattens an Observable-of-Observables by dropping the
 * next inner Observables while the current inner is still executing.</span>
 *
 * ![](exhaust.png)
 *
 * `exhaust` subscribes to an Observable that emits Observables, also known as a
 * higher-order Observable. Each time it observes one of these emitted inner
 * Observables, the output Observable begins emitting the items emitted by that
 * inner Observable. So far, it behaves like {@link mergeAll}. However,
 * `exhaust` ignores every new inner Observable if the previous Observable has
 * not yet completed. Once that one completes, it will accept and flatten the
 * next inner Observable and repeat this process.
 *
 * ## Example
 * Run a finite timer for each click, only if there is no currently active timer
 * ```ts
 * import { fromEvent, interval } from 'rxjs';
 * import { exhaustAll, map, take } from 'rxjs/operators';
 *
 * const clicks = fromEvent(document, 'click');
 * const higherOrder = clicks.pipe(
 *   map((ev) => interval(1000).pipe(take(5))),
 * );
 * const result = higherOrder.pipe(exhaustAll());
 * result.subscribe(x => console.log(x));
 * ```
 *
 * @see {@link combineLatestAll}
 * @see {@link concatAll}
 * @see {@link switchAll}
 * @see {@link switchMap}
 * @see {@link mergeAll}
 * @see {@link exhaustMap}
 * @see {@link zipAll}
 *
 * @return {Observable} An Observable that takes a source of Observables and propagates the first observable
 * exclusively until it completes before subscribing to the next.
 */
export function exhaustAll<T>(): OperatorFunction<any, T> {
  return operate((source, subscriber) => {
    let isComplete = false;
    let innerSub: Subscription | null = null;
    source.subscribe(
      new OperatorSubscriber(
        subscriber,
        (inner) => {
          if (!innerSub) {
            innerSub = innerFrom(inner).subscribe(
              new OperatorSubscriber(subscriber, undefined, undefined, () => {
                innerSub = null;
                isComplete && subscriber.complete();
              })
            );
          }
        },
        undefined,
        () => {
          isComplete = true;
          !innerSub && subscriber.complete();
        }
      )
    );
  });
}

/**
 * @deprecated renamed. Use {@link exhaustAll}.
 */
export const exhaust = exhaustAll;