<template>
  <div :class="$style.candidates">
    <div :class="$style.item" v-for="item in candidates">
      <p>{{ item.user.summary }}</p>
      <p>{{ format(item.start) }} - {{ format(item.end) }}</p>
    </div>
    =>
    <div :class="$style.item" v-for="item in swapped">
      <p>{{ item.user.summary }}</p>
      <p>{{ format(item.start) }} - {{ format(item.end) }}</p>
    </div>

    <button type="button">Swap</button>
  </div>

  <div :class="$style.grid">
    <div :class="$style.item" v-for="item in onCalls" @click="handleItem(item)">
      <p>{{ item.user.summary }}</p>
      <p>{{ format(item.start) }} - {{ format(item.end) }}</p>
    </div>
  </div>
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
import { pipe } from "ramda";
import { enNZ } from "date-fns/locale";

export default defineComponent({
  name: "App",
  components: {},
  setup() {
    const timeZone = "Pacific/Auckland";
    const token = window.localStorage.getItem("token");
    const pd = api({ token, tokenType: "bearer" } as Partial<APIParameters>);

    const onCalls = ref([]);
    onMounted(async () => {
      const { resource } = await pd.get("/oncalls", {
        data: {
          time_zone: timeZone,
          limit: 100,
          until: formatISO(addDays(90, new Date()))
        }
      });

      onCalls.value = resource.filter(onCall => onCall.schedule);
    });

    const format = pipe(
      parseISO,
      formatWithOptions({ weekStartsOn: 1, locale: enNZ }, "Pp")
    );

    const candidates = ref([]);

    function handleItem(clickedItem: unknown): void {
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
        const c0Start = c0.start;
        const c0End = c0.end;

        return [
          { ...c1, start: c0Start, end: c0End },
          { ...c0, start: c1.start, end: c1.end }
        ];
      } else {
        return [];
      }
    });

    async function swap() {
      const c = candidates.value;
      const s = swapped.value;

      const promises = [0, 1].map(i =>
        pd.post(`/schedules/${c[i].schedule.id}/overrides`, {
          data: {
            overrides: [
              {
                start: s[i].start,
                end: s[i].end,
                user: s[i].user,
                time_zone: timeZone
              }
            ]
          }
        })
      );

      const results = await Promise.allSettled(promises);
      if (results.every(r => (r.status = "fulfilled"))) {
        alert("Done!");
      } else {
        alert("Failed to swap!");
      }
    }

    return {
      candidates,
      format,
      handleItem,
      onCalls,
      swapped,
      swap,
      token
    };
  }
});
</script>

<style module>
.candidates {
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: #fff;
  display: flex;
  flex-flow: row nowrap;
  border: 1px solid #000;
  justify-content: space-between;
}

.grid {
  display: grid;
  grid-gap: 20px;
  grid-template-columns: repeat(5, 1fr);
}

.item {
}
</style>
