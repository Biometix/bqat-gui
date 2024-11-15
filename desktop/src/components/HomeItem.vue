<template>
  <div class="item">
    <i>
      <slot name="icon"></slot>
    </i>
    <div class="details">
      <h2>
        <slot name="heading"></slot>
      </h2>
      <slot></slot>
    </div>
  </div>
</template>

<style scoped>
.item {
  display: flex;
  position: relative;
  padding-bottom: 2vh;
  /* height:15vh; */
}

.details {
  flex: 1;
  margin-left: 2rem;
  align-content: top;
  /* height:fit-content */
}

i {
  display: flex;
  place-items: center;
  place-content: center;
  width: 32px;
  height: 32px;
  font-size: 25px;
  color: var(--color-text);
}

h2 {
  font-size: 1.4rem;
  font-weight: 500;
  margin-bottom: 0.4rem;
  color: var(--color-heading);
}

@media (min-width: 1024px) {
  .item {
    padding: 0.5rem 0 0.5rem calc(var(--section-gap) / 2);
    /* height:30vh */
    padding-bottom: 2vh;
  }
  .details {
    flex: 1;
    margin-left: 3rem;
    padding-inline: calc(var(--section-gap) / 2);
    align-content: center
  }

  i {
    top: calc(50% - 25px);
    left: -26px;
    position: absolute;
    border: 1px solid var(--color-border);
    background: var(--color-background);
    border-radius: 8px;
    width: 50px;
    height: 50px;
  }

  .item:before {
    content: ' ';
    border-left: 1px solid var(--color-border);
    position: absolute;
    left: 0;
    bottom: calc(50% + 25px);
    height: calc(50% - 25px);
  }

  .item:after {
    content: ' ';
    border-left: 1px solid var(--color-border);
    position: absolute;
    left: 0;
    top: calc(50% + 25px);
    height: calc(50% - 25px);
  }

  .item:first-of-type:before {
    display: none;
  }

  .item:last-of-type:after {
    display: none;
  }
  h2 {
    font-size: 1.5rem;
  }
}
</style>
