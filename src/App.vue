<template>
  <main :class="$style.main">
    <div
      v-for="(onCalls, name) in onCallsByName"
      class="card text-white bg-primary"
    >
      <div class="card-header">{{ name }}</div>
      <div class="list-group list-group-flush">
        <button
          v-for="item in onCalls"
          type="button"
          :class="[
            'list-group-item',
            'list-group-item-action',
            { active: candidates.includes(item) },
            $style.shift
          ]"
          @click="handleItem(item)"
        >
          {{ format(item.start) }} - {{ format(item.end) }}
        </button>
      </div>
    </div>
  </main>

  <aside :class="$style.aside">
    <template v-if="candidates.length === 2">
      <div class="card text-white bg-primary">
        <template v-for="item in candidates">
          <div class="card-header text-white ">
            {{ item.user.summary }}
          </div>
          <ul class="list-group list-group-flush">
            <li :class="['list-group-item', $style.shift]">
              {{ format(item.start) }} - {{ format(item.end) }}
            </li>
          </ul>
        </template>
      </div>

      <div :class="$style.arrowDown">
        ⬇️ ⬇️ ⬇️️ ⬇️ ⬇️️
      </div>

      <div class="card text-white bg-primary">
        <template v-for="item in swapped">
          <div class="card-header text-white ">
            {{ item.user.summary }}
          </div>
          <ul class="list-group list-group-flush">
            <li :class="['list-group-item', $style.shift]">
              {{ format(item.start) }} - {{ format(item.end) }}
            </li>
          </ul>
        </template>
      </div>

      <button type="button" class="btn btn-primary btn-lg" @click="swap()">
        Swap
      </button>
    </template>
    <div v-else class="alert alert-info" role="alert">
      🔃 Select 2 shifts from left and click "Swap" to swap them.
    </div>
  </aside>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref } from "vue";
import { api } from "@pagerduty/pdjs";
import { APIParameters } from "@pagerduty/pdjs/build/src/api";
import {
  addDays,
  formatISO,
  formatWithOptions,
  parseISO
} from "date-fns/esm/fp";
import { groupBy, pipe } from "ramda";
import { enNZ } from "date-fns/locale";

interface OnCall {
  user: { summary: string; [k: string]: string };
  schedule: Record<string, string>;
  escalation_policy: Record<string, string>;
  escalation_level: number;
  start: string;
  end: string;
}

export default defineComponent({
  name: "App",
  components: {},
  setup() {
    const timeZone = "Pacific/Auckland";
    const token = window.localStorage.getItem("token");
    const pd = api({ token, tokenType: "bearer" } as Partial<APIParameters>);

    const onCallsByName = ref<Record<string, OnCall[]>>({});
    async function loadOnCalls() {
      const { resource }: { resource: OnCall[] } = await pd.get("/oncalls", {
        data: {
          time_zone: timeZone,
          limit: 100,
          until: formatISO(addDays(90, new Date()))
        }
      });

      onCallsByName.value = groupBy(
        item => item.user.summary,
        resource.filter(onCall => onCall.schedule)
      );
    }
    onMounted(loadOnCalls);

    const format = pipe(
      parseISO,
      formatWithOptions({ weekStartsOn: 1, locale: enNZ }, "Pp")
    );

    const candidates = ref<OnCall[]>([]);

    function handleItem(clickedItem: OnCall): void {
      if (candidates.value.includes(clickedItem)) {
        candidates.value = candidates.value.filter(
          item => item !== clickedItem
        );
      } else {
        candidates.value = [...candidates.value.slice(-1), clickedItem];
      }
    }

    const swapped = computed(() => {
      if (candidates.value.length === 2) {
        const c0 = candidates.value[0];
        const c1 = candidates.value[1];

        return [
          { ...c0, user: c1.user },
          { ...c1, user: c0.user }
        ];
      } else {
        return [];
      }
    });

    async function swap() {
      const s = swapped.value;

      const promises = s.map(item =>
        pd.post(`/schedules/${item.schedule.id}/overrides`, {
          data: {
            overrides: [
              {
                start: item.start,
                end: item.end,
                user: item.user,
                time_zone: timeZone
              }
            ]
          }
        })
      );

      const results = await Promise.allSettled(promises);
      if (results.every(r => (r.status = "fulfilled"))) {
        alert('Done! Click "OK" to reload');
        candidates.value = [];
        loadOnCalls();
      } else {
        const reason = results
          .filter((r): r is PromiseRejectedResult => r.status === "rejected")
          .map(r => r.reason)
          .join("\n");
        alert(`Failed to swap! ${reason}`);
      }
    }

    return {
      candidates,
      format,
      handleItem,
      onCallsByName,
      swapped,
      swap,
      token
    };
  }
});
</script>

<style module>
body {
  display: grid;
  grid-template:
    "main aside" auto
    / 3fr 1fr;
  grid-gap: 20px;
  padding: 20px;
  min-height: 100vh;
}

.aside {
  position: sticky;
  top: 20px;
  z-index: 10;
  display: flex;
  flex-flow: column nowrap;
  justify-content: space-between;
  align-items: stretch;
  height: calc(100vh - 40px);
}

.main {
  display: grid;
  grid-gap: 20px;
  grid-template-columns: repeat(3, 1fr);
  align-items: start;
}

.shift {
  font-size: 14px;
}

.arrowDown {
  font-size: 50px;
  align-self: center;
}
</style>
